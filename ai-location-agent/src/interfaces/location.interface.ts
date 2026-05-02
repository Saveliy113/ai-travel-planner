export type GooglePlacesSearchType = 'type' | 'keyword' | 'textsearch';

export interface GetGooglePlacesQueryBind {
  name: string;
  lat: number;
  lon: number;
  radius: number;
  searchType: GooglePlacesSearchType;
}

export interface GooglePlacesData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  radius: number;
  searchType: GooglePlacesSearchType;
}