import { LocationBodyDto } from '../dtos/location.dto';
import { logger } from '../utils/logger';

import { openai } from '../loaders/openai';
import { QUERY_EXPANDER_PROMPT } from '../prompt/prompt';
import { GetGooglePlacesQueryBind, GooglePlacesData } from '../interfaces/location.interface';
import axios from 'axios';

class LocationService {
  private llmModel = process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07';

  private async getGooglePlacesData( { lat, lon, radius, searchType, name }: GetGooglePlacesQueryBind): Promise<GooglePlacesData> {
    try {
      const searchPath = ['type', 'keyword'].includes(searchType) ? 'nearbysearch' : 'textsearch';
      const { data } = await axios.get(`${process.env.GOOGLE_PLACES_API_URL}/${searchPath}/json`, {
        params: {
          location: `${lat},${lon}`,
          radius,
          key: process.env.GOOGLE_PLACES_API_KEY,
          ...(searchType === 'type' ? { type: name } : {}),
          ...(searchType === 'keyword' ? { keyword: name } : {}),
          ...(searchType === 'textsearch' ? { query: name } : {}),
        },
      });

      return data;
    } catch (error) {
      logger.error(
        `[LocationService] getGooglePlacesData: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  public async getLocation(body: LocationBodyDto): Promise<null> {
    try {
      const { lat, lon, destination, categories } = body;

      // Building query for categories with OpenAI API
      const query = await openai.chat.completions.create({
        model: this.llmModel,
        messages: [
          {
            role: 'system',
            content: QUERY_EXPANDER_PROMPT,
          },
          {
            role: 'user',
            content: JSON.stringify({
              destination: destination,
              categories,
            }),
          },
        ],
      });

      console.log(query.choices[0].message.content);
      // Requesting data from google places api — parse query.choices[0].message.content (JSON array with radiusMeters per category)

      return null;
    } catch (error) {
      logger.error(
        `[LocationService] getLocation: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}

export default LocationService;
