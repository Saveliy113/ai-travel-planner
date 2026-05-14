import axios from 'axios';
import type { FunctionParameters } from 'openai/resources/shared';

import type { TravelPlanGenerateBody, TravelPlanGenerateResult } from '../interfaces/travel-plan.interface';
import type { McpToolDefinition, OpenAITool } from '../interfaces/general.interface';
import { logger } from '../utils/logger';
import { weatherAgentClient } from '../loaders/mcpClient';

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

  public async generate(body: TravelPlanGenerateBody): Promise<TravelPlanGenerateResult> {
    try {
      logger.info(`[TravelPlanService] generate (stub) destination="${body.destination}"`);

      const targetLocation = body.destination.split(',').at(-1)?.trim();
      logger.info(`[TravelPlanService] Target Location: ${targetLocation}`);
      if (!targetLocation) {
        throw new Error('Error defining target location');
      }
      
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

      //Starting to generating plan via LLM
      const { tools: weatherTools } = await weatherAgentClient.listTools();
      const openaiWeatherTools = this.getTools(weatherTools);
      logger.info(
        `[TravelPlanService] Mapped ${openaiWeatherTools.length} weather tool(s) for OpenAI: ${openaiWeatherTools.map((t) => t.function.name).join(', ')}`,
      );
      // const query = await openai.chat.completions.create({
      //   model: this.llmModel,
      //   tool_choice: "auto",
      //   tools: this.
      //   messages: [
      //     {
      //       role: 'system',
      //       content: TRAVEL_PLAN_GENERATE_PROMPT,
      //     },
      //     {
      //       role: 'user',
      //       content: JSON.stringify({
      //         ...body,
      //         latitude: targetLocationData.latitude,
      //         longitude: targetLocationData.longitude,
      //       }),
      //     },
      //   ],
      // });

      // const queryResult = query.choices[0].message.content;
      

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
