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

/** Immediate HTTP response from POST /travel-plan/generate (generation continues in background). */
export interface TravelPlanGenerateAcceptedResponse {
  ok: true;
  jobId: string;
}

/** Final itinerary JSON shape (matches TRAVEL_PLAN_GENERATE_PROMPT in prompt.ts). */
export interface TravelPlanActivityPoi {
  name: string;
  placeId: string;
}

export interface TravelPlanActivity {
  startTime: string;
  endTime: string;
  type: string;
  title: string;
  description: string;
  poi: TravelPlanActivityPoi;
  reasoning: string;
  tips: string[];
}

export interface TravelPlanDayWeather {
  summary: string;
  temperatureMin: number;
  temperatureMax: number;
  precipitationMm: number;
}

export interface TravelPlanFoodRec {
  type: 'breakfast' | 'lunch' | 'dinner' | 'drinks';
  name: string;
  reasoning: string;
}

export interface TravelPlanBackupOption {
  condition: string;
  alternative: string;
}

export interface TravelPlanDay {
  date: string;
  dayNumber: number;
  weather: TravelPlanDayWeather;
  area: string;
  pace: 'light' | 'moderate' | 'active';
  activities: TravelPlanActivity[];
  foodRecommendations: TravelPlanFoodRec[];
  backupOptions: TravelPlanBackupOption[];
  dailyNotes: string[];
}

export interface TravelPlanJson {
  destination: string;
  summary: {
    tripStyle: string;
    weatherOverview: string;
    planningLogic: string;
  };
  days: TravelPlanDay[];
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
  season_type: string;
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
