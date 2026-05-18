import axios from 'axios';
import moment from 'moment';
import type { FunctionParameters } from 'openai/resources/shared';

import type { TravelPlanGenerateBody, TravelPlanGenerateResult } from '../interfaces/travel-plan.interface';
import { broadcastTravelPlanEvent } from '../ws/travel-plan-ws.hub';
import type { McpToolDefinition, OpenAITool } from '../interfaces/general.interface';
import { logger } from '../utils/logger';
import { weatherAgentClient, locationAgentClient } from '../loaders/mcpClient';
import { EXTRACT_POI_CATEGORIES_PROMPT, TRAVEL_PATTERNS_RETRIEVAL_PROMPT, TRAVEL_PATTERNS_RERANK_AGGREGATED_PROMPT, TRAVEL_PLAN_GENERATE_PROMPT, TRAVEL_PLAN_TOOLS_INSTRUCTIONS_PROMPT } from '../prompt/prompt';
import { openai } from '../loaders/openai';
import type { ChatCompletionMessage, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { CallToolResultSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { qdrantClient } from '../loaders/qdrant';

class TravelPlanService {
  private llmModel = process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07';
  private openaiEmbeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large';

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
          raw = await weatherAgentClient.callTool(params, undefined, {
            timeout: 300_000,
          });
          break;
        case 'get_poi':
          // Getting detailed categories for the destination and interests
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

          raw = await locationAgentClient.callTool(params, undefined, {
            timeout: 300_000,
          });
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

  private async rerankPatternsWithLLM(
    aggregatedProfileText: string,
    candidates: string[],
  ): Promise<string[]> {
    if (candidates.length === 0) return [];

    const rerankResponse = await openai.chat.completions.create({
      model: this.llmModel,
      messages: [
        { role: 'system', content: TRAVEL_PATTERNS_RERANK_AGGREGATED_PROMPT },
        {
          role: 'user',
          content: `[Traveler Preferences Profile]\n${aggregatedProfileText}\n\n[Candidate patterns]\n${JSON.stringify(candidates, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = rerankResponse.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content) as { selected_patterns?: string[] };
    return Array.isArray(parsed.selected_patterns) ? parsed.selected_patterns : [];
  }

  private async getOpenaiEmbedding(text: string): Promise<number[]> {
    try {
      const result = await openai.embeddings.create({
        model: this.openaiEmbeddingModel,
        input: text,
      });
      return result.data[0].embedding;
    } catch (error) {
      logger.error(`[TravelPlanService] getOpenaiEmbedding: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  private functionToolNames(message: ChatCompletionMessage | undefined): string[] {
    if (!message?.tool_calls?.length) return [];
    return message.tool_calls.filter((t) => t.type === 'function').map((t) => t.function.name);
  }

  /** One LLM completion with tools + executing returned function calls. Logs whether get_poi was requested. */
  private async runLlmToolRound(params: {
    round: number;
    messages: ChatCompletionMessageParam[];
    openaiTools: OpenAITool[];
    toolChoice: 'required' | 'auto';
    body: TravelPlanGenerateBody;
    targetLocation: string;
    travelDurationDays: number;
  }): Promise<void> {
    const { round, messages, openaiTools, toolChoice, body, targetLocation, travelDurationDays } = params;

    logger.info(
      `[TravelPlanService] LLM tool round ${round} · start (tool_choice=${toolChoice}, tools=${openaiTools.map((t) => t.function.name).join(', ')})`,
    );

    const llmResponse = await openai.chat.completions.create({
      model: this.llmModel,
      tools: openaiTools,
      tool_choice: toolChoice,
      messages,
    });

    const message = llmResponse.choices[0]?.message;
    if (!message) {
      throw new Error('Empty response from OpenAI');
    }

    const names = this.functionToolNames(message);
    const getPoiInResponse = names.includes('get_poi');
    logger.info(
      `[TravelPlanService] LLM tool round ${round} · assistant tool calls: [${names.join(', ') || 'none'}] · get_poi in this response: ${getPoiInResponse}`,
    );

    if (!message.tool_calls?.length) {
      logger.warn(
        `[TravelPlanService] LLM tool round ${round} · no tool_calls (finish_reason may be stop/text only)`,
      );
      messages.push(message);
      return;
    }

    messages.push(message);

    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== 'function') {
        logger.warn(`[TravelPlanService] Skipping non-function tool call type=${toolCall.type}`);
        continue;
      }

      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      logger.info(
        `[TravelPlanService] LLM tool round ${round} · executing MCP tool: ${functionName} · is_get_poi=${functionName === 'get_poi'}`,
      );

      const result = await this.callTool(
        functionName,
        functionName === 'get_forecast'
          ? args
          : {
              destination: body.destination,
              clarification: targetLocation,
              travelDurationDays: travelDurationDays,
              interests: body.interests,
              additionalPreferences: body.additionalPreferences,
            },
      );

      logger.info(`[TravelPlanService] MCP tool result (${functionName}): ${JSON.stringify(result)}`);

      messages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: result.content
          .map((block) => (block.type === 'text' ? block.text : JSON.stringify(block)))
          .join('\n'),
      });
    }
  }

  public async generate(body: TravelPlanGenerateBody, jobId: string): Promise<TravelPlanGenerateResult> {
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

      // Generating retrieval query list, then one aggregated pseudo-profile embedding + Qdrant top-20 + LLM rerank
      logger.info(`[TravelPlanService] Generating search queries for travel patterns`);
      const searchQueries = await openai.chat.completions.create({
        model: this.llmModel,
        messages: [
          { role: 'system', content: TRAVEL_PATTERNS_RETRIEVAL_PROMPT },
          { role: 'user', content: JSON.stringify(body) },
        ],
      });

      const searchQueriesData = JSON.parse(searchQueries.choices[0].message.content || '[]');
      logger.info(`[TravelPlanService] Search queries count: ${searchQueriesData.queries.length}`);

      let aggregatedProfileText = '';
      let finalPatterns: string[] = [];

      if (searchQueriesData.queries.length > 0) {
        // Joining search queries into a single travel profile
        aggregatedProfileText = `Traveler Preferences Profile:\n${searchQueriesData.queries.map((q: string) => `- ${q}`).join('\n')}`;

        const embedding = await this.getOpenaiEmbedding(aggregatedProfileText);

        logger.info(`[TravelPlanService] Searching travel patterns in Qdrant`);
        const rawResults = await qdrantClient.search('travel_patterns', {
          vector: embedding,
          with_payload: true,
          score_threshold: 0.5,
          limit: 50,
        });

        const candidates: string[] = rawResults
          .map((point: Record<string, unknown>) => String((point.payload as { embedding_text?: string })?.embedding_text || '').trim())
          .filter((s: string) => s.length > 0);

        logger.info(`[TravelPlanService] Candidate patterns before rerank: ${candidates.length}`);

        finalPatterns =
          candidates.length > 0
            ? await this.rerankPatternsWithLLM(aggregatedProfileText, candidates)
            : [];

        logger.info(`[TravelPlanService] Relevant patterns after rerank: ${JSON.stringify(finalPatterns)}`);
      } else {
        logger.warn('[TravelPlanService] No retrieval queries; skipping travel pattern Qdrant step');
      }

      // Starting to generating plan via LLM
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: TRAVEL_PLAN_GENERATE_PROMPT,
        },
        {
          role: 'user',
          content: TRAVEL_PLAN_TOOLS_INSTRUCTIONS_PROMPT,
        },
        {
          role: 'user',
          content: JSON.stringify({
            ...body,
            latitude: targetLocationData.latitude,
            longitude: targetLocationData.longitude,
            travelPatterns: finalPatterns,
          }),
        },
      ];

      await this.runLlmToolRound({
        round: 1,
        messages,
        openaiTools,
        toolChoice: 'required',
        body,
        targetLocation,
        travelDurationDays,
      });

      messages.push({
        role: 'user',
        content:
          '[Orchestration test — tool round 2] If get_poi was not called in round 1, you MUST call get_poi now. If both get_forecast and get_poi already ran, you may respond without additional tool calls.',
      });

      await this.runLlmToolRound({
        round: 2,
        messages,
        openaiTools,
        toolChoice: 'auto',
        body,
        targetLocation,
        travelDurationDays,
      });

      // Calling llm again to get final plan
      logger.info(`[TravelPlanService] Calling llm again to get final plan`);
      const finalPlanCompletion = await openai.chat.completions.create({
        model: this.llmModel,
        messages,
        response_format: { type: 'json_object' },
      });

      const finalPlan = JSON.parse(finalPlanCompletion.choices[0].message.content || '{}');
      logger.info(`[TravelPlanService] Final plan: ${JSON.stringify(finalPlan, null, 2)}`);

      broadcastTravelPlanEvent(jobId, { type: 'plan_done', jobId, plan: finalPlan });

      return { ok: true, message: 'completed' };
    } catch (error) {
      logger.error(
        `[TravelPlanService] generate: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}

export default TravelPlanService;
