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

export interface GooglePlacesApiResponse {
 next_page_token: string;
 results: GooglePlacesPoiItem[];
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