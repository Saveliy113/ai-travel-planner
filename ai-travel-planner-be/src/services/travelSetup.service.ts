import axios from 'axios';

import type { TravelSetupGenerateBody, TravelSetupGenerateResult } from '../interfaces/travelSetup.interface';
import { logger } from '../utils/logger';

class TravelSetupService {
  public async generate(body: TravelSetupGenerateBody): Promise<TravelSetupGenerateResult> {
    try {
      logger.info(`[TravelSetupService] generate (stub) destination="${body.destination}"`);

      // Searching lat and lon via Geocoding API
      logger.info(`[TravelSetupService] Searching lat and lon via Geocoding API`);
      const targetLocation = body.destination.split(',').at(-1)?.trim();
      logger.info(`[TravelSetupService] Target Location: ${targetLocation}`);
      if (!targetLocation) {
        throw new Error('Error defining target location');
      }

      const { data: { results: [targetLocationData] } } = await axios.get(`${process.env.GEOCODING_API_URL}/search`, {
        params: {
          name: targetLocation,
          count: 1,
          language: 'en',
          format: 'json',
        },
      });
      logger.info(`[TravelSetupService] Location: ${body.destination}; Latitude: ${targetLocationData.latitude}; Longitude: ${targetLocationData.longitude}`);

      // Getting weather information via Weather Agent
      logger.info(`[TravelSetupService] Getting weather information via Weather Agent by lat=${targetLocationData.latitude} and lon=${targetLocationData.longitude}`);
      const { data: weatherData } = await axios.get(`${process.env.AI_WEATHER_AGENT_URL}/forecast`, {
        params: {
          lat: targetLocationData.latitude,
          lon: targetLocationData.longitude,
          startDate: body.startDate,
          endDate: body.endDate,
        },
      });
      logger.info(`[TravelSetupService] Weather information loaded successfully`);

      // Getting POI information via Location Agent

      // Getting Travel Plan via Travel Itinerary Agent
      return { ok: true, message: 'Not implemented' };
    } catch (error) {
      logger.error(
        `[TravelSetupService] generate: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}

export default TravelSetupService;
