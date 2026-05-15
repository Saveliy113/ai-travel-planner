import axios from 'axios';
import { LocationBodyDto, LocationInterestsBodyDto } from '../dtos/location.dto';
import { logger } from '../utils/logger';

import { openai } from '../loaders/openai';
import { TRAVEL_INTERESTS_SYSTEM_PROMPT } from '../prompt/prompt';
import {
  GetGooglePlacesQueryBind,
  GooglePlacesPoiItem,
  GooglePlacesPoiResponse,
  LocationCategoryResult,
} from '../interfaces/location.interface';

/** Default search radius (m) when categories are supplied without LLM-expanded radii. */
const DEFAULT_NEARBY_RADIUS_METERS = 5000;

class LocationService {
  private llmModel = process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07';

  private normalizePoiMetrics(poi: GooglePlacesPoiResponse): { rating: number; reviews: number } {
    const r = poi.rating;
    const rating = typeof r === 'number' && Number.isFinite(r) ? Math.max(0, r) : 0;
    const u = poi.userRatingsTotal;
    const reviews =
      typeof u === 'number' && Number.isFinite(u) ? Math.max(0, Math.trunc(u)) : 0;
    return { rating, reviews };
  }

  /** Composite score: rating × ln(1 + reviews); missing/non-finite values → 0. */
  private poiCompositeScore(poi: GooglePlacesPoiResponse): number {
    const { rating, reviews } = this.normalizePoiMetrics(poi);
    return rating * Math.log1p(reviews);
  }

  private sortPlacesByRatingAndReviews(places: GooglePlacesPoiResponse[]): void {
    places.sort((a, b) => {
      const diff = this.poiCompositeScore(b) - this.poiCompositeScore(a);
      if (diff !== 0) return diff;
      const { rating: ra, reviews: ua } = this.normalizePoiMetrics(a);
      const { rating: rb, reviews: ub } = this.normalizePoiMetrics(b);
      if (rb !== ra) return rb > ra ? 1 : -1;
      return ub - ua;
    });
  }

  private async getGooglePlacesData( { lat, lon, radius, searchType, name }: GetGooglePlacesQueryBind): Promise<GooglePlacesPoiResponse[]> {
    try {
      const searchPath = ['type', 'keyword'].includes(searchType) ? 'nearbysearch' : 'textsearch';
      const { data } = await axios.get(`${process.env.GOOGLE_PLACES_API_URL}/${searchPath}/json`, {
        params: {
          ...(searchType !== 'textsearch' ? { location: `${lat},${lon}` } : {}),
          ...(searchType !== 'textsearch' ? { radius } : {}),
          key: process.env.GOOGLE_PLACES_API_KEY,
          ...(searchType === 'type' ? { type: name } : {}),
          ...(searchType === 'keyword' ? { keyword: name } : {}),
          ...(searchType === 'textsearch' ? { query: name } : {}),
        },
      });

      return data.results.map((result: GooglePlacesPoiItem) => ({
        name: result.name,
        businessStatus: result.business_status,
        formattedAddress: result.formatted_address,
        photos: result.photos,
        placeId: result.place_id,
        rating: result.rating,
        types: result.types,
        userRatingsTotal: result.user_ratings_total,
      }));
    } catch (error) {
      logger.error(
        `[LocationService] getGooglePlacesData: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  public async getLocation(body: LocationBodyDto): Promise<{ places: LocationCategoryResult[] }> {
    try {
      const { lat, lon, categories } = body;

      const places: LocationCategoryResult[] = [];

      for (const category of categories) {
        const googlePlacesData = await this.getGooglePlacesData({
          lat,
          lon,
          radius: DEFAULT_NEARBY_RADIUS_METERS,
          searchType: 'keyword',
          name: category.name,
        });

        this.sortPlacesByRatingAndReviews(googlePlacesData);
        places.push({
          name: category.name,
          count: category.count,
          items: googlePlacesData.slice(0, category.count),
        });
      }

      return { places };
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
