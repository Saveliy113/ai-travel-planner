import axios from 'axios';
import type { FunctionParameters } from 'openai/resources/shared';

import type { TravelPlanGenerateBody, TravelPlanGenerateResult } from '../interfaces/travel-plan.interface';
import type { McpToolDefinition, OpenAITool } from '../interfaces/general.interface';
import { logger } from '../utils/logger';
import { weatherAgentClient, locationAgentClient } from '../loaders/mcpClient';
import { EXTRACT_POI_CATEGORIES_PROMPT, TRAVEL_PLAN_GENERATE_PROMPT } from '../prompt/prompt';
import { openai } from '../loaders/openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { CallToolResultSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import moment from 'moment';

class TravelPlanService {
  private llmModel = process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07';

  private getTools(tools: McpToolDefinition[]): OpenAITool[] {
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema as FunctionParameters,
      },
    }));
  }

  private parseCallToolResult(raw: unknown): CallToolResult {
    const parsed = CallToolResultSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid MCP tools/call result: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  private async callTool(toolName: string, args: Record<string, unknown>): Promise<CallToolResult> {
    try {
      const params = { name: toolName, arguments: args };
      let raw: unknown;
      switch (toolName) {
        case 'get_forecast':
          raw = await weatherAgentClient.callTool(params);
          break;
        case 'get_poi':
          // Getting detailed categories for the destination and interests
          console.log(args);
          const completion = await openai.chat.completions.create({
            model: this.llmModel,
            messages: [
              {
                role: 'system',
                content: EXTRACT_POI_CATEGORIES_PROMPT,
              },
              {
                role: 'user',
                content: JSON.stringify({
                  destination: args.destination,
                  interests: args.interests,
                }),
              },
            ],
          });
          const data = JSON.parse(completion.choices[0].message.content || '[]');
          params.arguments = {categories: data.categories.map((category: { searchQuery: string; count: number }) => ({
            searchQuery: category.searchQuery,
            count: category.count,
          })),
        };
  
        console.log('CATEGORIES DATA: ', params.arguments);


          raw = await locationAgentClient.callTool(params);
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
      return this.parseCallToolResult(raw);
    } catch (error) {
      logger.error(`[TravelPlanService] callTool: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  public async generate(body: TravelPlanGenerateBody): Promise<TravelPlanGenerateResult> {
    try {
      logger.info(`[TravelPlanService] generate (stub) destination="${body.destination}"`);

      // Getting LLM MCP Tools
      logger.info(`[TravelPlanService] Getting LLM MCP Tools`);
      const { tools: weatherTools } = await weatherAgentClient.listTools();
      const { tools: locationTools } = await locationAgentClient.listTools();
      const openaiTools = this.getTools([...weatherTools, ...locationTools]);
      logger.info(`[TravelPlanService] OpenAI Tools: ${openaiTools.map((t) => t.function.name).join(', ')}`);

      // Defining target location
      const targetLocation = body.destination.split(',').at(-1)?.trim();
      logger.info(`[TravelPlanService] Target Location: ${targetLocation}`);
      if (!targetLocation) {
        throw new Error('Error defining target location');
      }

      // Defining travel duration
      const travelDurationDays = moment(body.endDate).diff(moment(body.startDate), 'days');
      logger.info(`[TravelPlanService] Travel Duration: ${travelDurationDays} days`);
    
      logger.info(`[TravelPlanService] Searching lat and lon via Geocoding API`);
      const {
        data: {
          results: [targetLocationData],
        },
      } = await axios.get(`${process.env.GEOCODING_API_URL}/search`, {
        params: {
          name: targetLocation,
          count: 1,
          language: 'en',
          format: 'json',
        },
      });
      logger.info(
        `[TravelPlanService] Location: ${body.destination}; Latitude: ${targetLocationData.latitude}; Longitude: ${targetLocationData.longitude}`,
      );

      // Starting to generating plan via LLM
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: TRAVEL_PLAN_GENERATE_PROMPT,
        },
        {
          role: 'user',
          content: JSON.stringify({
            ...body,
            latitude: targetLocationData.latitude,
            longitude: targetLocationData.longitude,
          }),
        },
      ];

      const llmResponse = await openai.chat.completions.create({
        model: this.llmModel,
        tools: openaiTools,
        tool_choice: "auto",
        messages,
      });

      const message = llmResponse.choices[0].message;

      if (!message) {
        throw new Error('Empty response from OpenAI');
      }

      // If LLM used tools,
      // call tools by MCP Client
      if (message.tool_calls && message.tool_calls.length > 0) {
        logger.info(
          `[TravelPlanService] LLM used tools: ${message.tool_calls
            .filter((t) => t.type === 'function')
            .map((t) => t.function.name)
            .join(', ')}`,
        );
        for (const toolCall of message.tool_calls) {
          if (toolCall.type !== 'function') {
            logger.warn(`[TravelPlanService] Skipping non-function tool call type=${toolCall.type}`);
            continue;
          }

          // Defining tool name and arguments
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          // Calling MCP tool (arguments come from the model; must match MCP tool schemas)
          logger.info(`[TravelPlanService] Calling MCP tool: ${functionName}`);
          const result = await this.callTool(functionName, functionName === 'get_forecast' ? args : {
            destination: body.destination,
            clarification: targetLocation,
            travelDurationDays: travelDurationDays,
            interests: body.interests,
            additionalPreferences: body.additionalPreferences,
          });
          logger.info(`[TravelPlanService] MCP tool result: ${JSON.stringify(result)}`);

          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: result.content
              .map((block) => (block.type === 'text' ? block.text : JSON.stringify(block)))
              .join('\n'),
          });
        }
      }

      return { ok: true, message: 'Not implemented' };
    } catch (error) {
      logger.error(
        `[TravelPlanService] generate: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}

export default TravelPlanService;
