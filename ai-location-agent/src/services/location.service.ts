import { LocationBodyDto, LocationInterestsBodyDto } from '../dtos/location.dto';
import { logger } from '../utils/logger';

import { openai } from '../loaders/openai';
import { TRAVEL_INTERESTS_SYSTEM_PROMPT, VALIDATE_PLACES_SYSTEM_PROMPT } from '../prompt/prompt';
import {
  GoogleMapsPlaceDetailsPayload,
  GoogleMapsSearchPlacesPayload,
  GooglePlacesPoiResponse,
  LocationCategoryResult,
  LocationPoiResult,
} from '../interfaces/location.interface';
import { googleMapsMcpClient } from '../loaders/mcpClient';

class LocationService {
  private llmModel = process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07';

  private parseMapsSearchPlacesMcpResult<T>(data: { content: Array<{ type: string; text?: string }> }): T {
    try {
      const text = data.content
        .filter(b =>
          b.type === 'text' && typeof b.text === 'string',
        )
        .map((b) => b.text)
        .join('\n');

      const parsedData: T = JSON.parse(text);

      return parsedData;
    } catch (error) {
      logger.error(
        `[LocationService] parseMapsSearchPlacesMcpResult: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private async getGooglePlacesData(searchQuery: string): Promise<GooglePlacesPoiResponse[]> {
    try {
      // Getting places from Google Maps
      const raw = await googleMapsMcpClient.callTool({
        name: 'maps_search_places',
        arguments: {
          query: searchQuery,
        },
      });
      const data = this.parseMapsSearchPlacesMcpResult<GoogleMapsSearchPlacesPayload>(raw as { content: Array<{ type: string; text?: string }> });
      
      // Enriching places with detailed data
      const response = await Promise.all(data.places.map(async (result) => {
        const detailedRaw = await googleMapsMcpClient.callTool({
          name: 'maps_place_details',
          arguments: {
            place_id: result.place_id,
          },
        });
        const detailedData = this.parseMapsSearchPlacesMcpResult<GoogleMapsPlaceDetailsPayload>(detailedRaw as { content: Array<{ type: string; text?: string }> });

        return {
          name: result.name,
          placeId: result.place_id,
          formattedAddress: result.formatted_address,
          rating: result.rating,
          reviews: (detailedData.reviews || []).map(review => ({
            text: review.text,
            time: review.time,
          })),
          types: result.types,
          workingHours: detailedData.opening_hours?.weekday_text || [],
        };
      }));

      return response;
    } catch (error) {
      logger.error(
        `[LocationService] getGooglePlacesData: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  public async getLocation(body: LocationBodyDto): Promise<{ places: LocationPoiResult[] }> {
    try {
      const { categories } = body;

      const places: LocationCategoryResult[] = [];

      for (const category of categories) {
        const googlePlacesData = await this.getGooglePlacesData(category.searchQuery);

        places.push({
          name: category.name ?? category.searchQuery,
          count: category.count,
          items: googlePlacesData,
        });
      }

      // Validating places against category name and count via openAI
      const completion = await openai.chat.completions.create({
        model: this.llmModel,
        messages: [
          {
            role: 'system',
            content: VALIDATE_PLACES_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: JSON.stringify({ places }),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      logger.error(
        `[LocationService] getLocation: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  public async getInterests(body: LocationInterestsBodyDto): Promise<unknown> {
    try {
      const { destination } = body;
      const completion = await openai.chat.completions.create({
        model: this.llmModel,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: TRAVEL_INTERESTS_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: JSON.stringify({ destination }),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return JSON.parse(content) as unknown;
    } catch (error) {
      logger.error(
        `[LocationService] getInterests: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}

export default LocationService;
