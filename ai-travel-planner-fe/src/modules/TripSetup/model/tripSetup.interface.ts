export interface TripSetupModuleProps {
  className?: string
}

export interface DestinationClarificationOption {
  name: string
  description: string
}
export interface DestinationValidationResult {
  isValidLocation: boolean
  normalizedLocation: string
  locationType: string
  containsMultipleLocations: boolean
  ambiguityDetected: boolean
  clarificationRequired: boolean
  clarificationReason: string
  clarificationOptions: DestinationClarificationOption[]
  confidence: number
}

export interface ValidateDestinationRequestBody {
  destination: string
}

export interface DestinationStepProps {
  onProceedToNextStep: (
    validation: DestinationValidationResult,
    selectedClarification?: DestinationClarificationOption,
  ) => void
}

export type Phase = "input" | "clarify"

/** One interest row from `POST /location/interests` (LLM). */
export interface TravelInterestCategory {
  label: string
  searchQuery: string
  description: string
}

export interface DestinationInterestsResponse {
  categories: TravelInterestCategory[]
}

/** Payload for `POST /travel-plan/generate` (matches TripSetup wizard summary). */
export interface TripSetupPlanPayload {
  destination: string
  startDate: string
  endDate: string
  budget: string
  interests: TravelInterestCategory[]
  additionalPreferences: string
}

/** Immediate response from `POST /travel-plan/generate` (plan completes over WebSocket). */
export type TravelSetupGenerateResult = import("./travel-plan-result.interface").TravelPlanGenerateAcceptedResponse

export interface TripSetupStore {
  step: number;
  setStep: (step: number) => void;
  destination: string;
  setDestination: (destination: string) => void;
  normalizedDestination: string;
  setNormalizedDestination: (destination: string) => void;
  firstStepPhase: Phase;
  setFirstStepPhase: (phase: Phase) => void;
  clarificationReason: string;
  setClarificationReason: (reason: string) => void;
  clarificationOptions: DestinationClarificationOption[];
  setClarificationOptions: (options: DestinationClarificationOption[]) => void;
  selectedClarification: string;
  setSelectedClarification: (clarification: string) => void;
  selectedClarificationDescription: string;
  setSelectedClarificationDescription: (description: string) => void;
  locationType: string;
  setLocationType: (type: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  budget: string;
  setBudget: (budget: string) => void;
  interestCategories: TravelInterestCategory[];
  setInterestCategories: (categories: TravelInterestCategory[]) => void;
  selectedInterestLabels: string[];
  toggleInterestSelection: (label: string) => void;
  additionalPreferences: string;
  setAdditionalPreferences: (value: string) => void;
  reset: () => void;
}