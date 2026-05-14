export interface TravelPlanClarificationOption {
  name: string;
  description: string;
}

export interface TravelPlanInterestCategory {
  label: string;
  searchQuery: string;
  description: string;
}

/** Body shape aligned with the TripSetup wizard payload (frontend). */
export interface TravelPlanGenerateBody {
  step?: number;
  destination: string;
  locationType?: string;
  firstStepPhase?: string;
  clarificationReason?: string;
  clarificationOptions?: TravelPlanClarificationOption[];
  selectedClarification?: string;
  selectedClarificationDescription?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  interestCategories?: TravelPlanInterestCategory[];
  selectedInterestLabels?: string[];
  selectedInterests?: TravelPlanInterestCategory[];
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
