import axios from 'axios';

import type { TravelPlanGenerateBody, TravelPlanGenerateResult } from '../interfaces/travel-plan.interface';
import { logger } from '../utils/logger';

class TravelPlanService {
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

      //TODO: Implement weather agent call via MCP
      logger.info(
        `[TravelPlanService] Getting weather information via Weather Agent by lat=${targetLocationData.latitude} and lon=${targetLocationData.longitude}`,
      );
      await axios.get(`${process.env.AI_WEATHER_AGENT_URL}/forecast`, {
        params: {
          lat: targetLocationData.latitude,
          lon: targetLocationData.longitude,
          startDate: body.startDate,
          endDate: body.endDate,
        },
      });
      logger.info(`[TravelPlanService] Weather information loaded successfully`);

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
