/** One interest row from Trip / travel-setup (matches backend JSON). */
export interface TravelPlanInterest {
  label: string;
  type: string;
  google_places_query: string;
  description: string;
}

/** POST /travel-plan/generate body — same shape as travel-planner-be TripSetup final payload. */
export interface TravelPlanGenerateBody {
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  interests: TravelPlanInterest[];
  additionalPreferences?: string;
}

/** Extend when the generate flow returns real data. */
export interface TravelPlanGenerateResult {
  ok: boolean;
  message?: string;
}

export interface GeocodingResponseI {
  results: GeocodingResultItem[];
}

export interface GeocodingResultItem {
  name: string;
  latitude: number;
  longitude: number;
}

export type TravelPatternCategory =
  | 'weather'
  | 'timing'
  | 'logistics'
  | 'health'
  | 'culture';

/** Provenance from pattern generation seeds (optional in Qdrant payload). */
export interface TravelPatternSource {
  traveler_type: string;
  location_type: string;
  focus_area: string;
}

/** Heuristic If–Then pattern stored in Qdrant / returned to the planner. */
export interface TravelPattern {
  /** Qdrant point id (UUID) when included in API responses. */
  id?: string;
  category: TravelPatternCategory;
  tags: string[];
  condition: string;
  action: string;
  embedding_text: string;
  source?: TravelPatternSource;
}
