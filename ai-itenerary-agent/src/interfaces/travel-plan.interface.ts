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
