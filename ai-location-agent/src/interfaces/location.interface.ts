import { z } from 'zod';

export type GooglePlacesSearchType = 'type' | 'keyword' | 'textsearch';

export interface GetGooglePlacesQueryBind {
  name: string;
  lat: number;
  lon: number;
  radius: number;
  searchType: GooglePlacesSearchType;
}

export interface GooglePlacesPhotoItem {
  height: number;
  width: number;
  photo_reference: string;
}

export interface GooglePlacesPoiItem {
  business_status: string;
  name: string;
  formatted_address: string;
  photos: GooglePlacesPhotoItem[];
  place_id: string;
  rating?: number;
  types: string[];
  user_ratings_total?: number;
}

export interface GooglePlacesPoiResponse {
  name: string;
  businessStatus: string;
  formattedAddress: string;
  photos: GooglePlacesPhotoItem[];
  placeId: string;
  rating?: number;
  types: string[];
  userRatingsTotal?: number;
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

/** MCP tool `get_location` arguments (Zod raw shape for McpServer.registerTool). */
const locationMcpToolInputSchema = {
  destination: z.string().describe('Destination label / area name for place search context'),
  lat: z.number().describe('Latitude (WGS84)'),
  lon: z.number().describe('Longitude (WGS84)'),
  categories: z
    .array(
      z.object({
        name: z.string().describe('Category or place type to search (e.g. museums, cafes)'),
        count: z.number().int().min(1).describe('Max number of POIs to return for this category'),
      }),
    )
    .describe('Search categories with per-category result limits'),
};

export { locationMcpToolInputSchema };
