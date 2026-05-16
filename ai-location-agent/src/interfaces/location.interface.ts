import { z } from 'zod';

export type GooglePlacesSearchType = 'type' | 'keyword' | 'textsearch';

export interface GetGooglePlacesQueryBind {
  name: string;
  lat: number;
  lon: number;
  radius: number;
  searchType: GooglePlacesSearchType;
}
    
export interface GooglePlacesPoiItem {
  name: string;
  formatted_address: string;
  place_id: string;
  rating?: number;
  types: string[];
  workingHours: string[];
}

export interface GooglePlacesPoiResponse {
  name: string;
  formattedAddress: string;
  placeId: string;
  rating?: number;
  types: string[];
  workingHours: string[];
  reviews: {
    text: string;
    time: number;
  }[];
}

export interface LocationPoiResult {
  name: string;
  formattedAddress: string;
  placeId: string;
  rating?: number;
  types: string[];
  workingHours: string[];
  reviewsSummary: string;
}

export interface CategoryQuery {
  name: string;
  count: number;
  mode: GooglePlacesSearchType;
  confidence: number;
  density: 'dense' | 'medium' | 'sparse';
  radiusMeters: number;
  reason: string;
}

export interface LocationCategoryResult {
  name: string;
  count: number;
  items: GooglePlacesPoiResponse[];
}

/** MCP tool `get_poi`: geo context from caller; `categories` are pre-built by the itinerary agent (name + count per category). */
const locationMcpToolInputSchema = {
  categories: z
    .array(
      z.object({
        searchQuery: z
          .string()
          .describe('Google Places search query, from planner'),
        count: z.number().int().min(1).describe('Max POIs to return for this row'),
      }),
    ).min(1).describe('Planner-generated category rows only — not raw trip `interests` objects'),
};

export interface GoogleMapsSearchPlacesPayload {
  places: GooglePlacesPoiItem[];
}

export interface GoogleMapsPlaceDetailsPayload {
  reviews: {
    text: string;
    time: number;
  }[];
  opening_hours: {
    weekday_text: string[];
  };
}

export { locationMcpToolInputSchema };
