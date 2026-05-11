export interface TravelSetupClarificationOption {
  name: string;
  description: string;
}

export interface TravelSetupInterestCategory {
  label: string;
  searchQuery: string;
  description: string;
}

/** Body shape aligned with the TripSetup wizard payload (frontend). */
export interface TravelSetupGenerateBody {
  step?: number;
  destination: string;
  locationType?: string;
  firstStepPhase?: string;
  clarificationReason?: string;
  clarificationOptions?: TravelSetupClarificationOption[];
  selectedClarification?: string;
  selectedClarificationDescription?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  interestCategories?: TravelSetupInterestCategory[];
  selectedInterestLabels?: string[];
  selectedInterests?: TravelSetupInterestCategory[];
  additionalPreferences?: string;
}

/** Extend when the generate flow returns real data. */
export interface TravelSetupGenerateResult {
  ok: boolean;
  message?: string;
}
