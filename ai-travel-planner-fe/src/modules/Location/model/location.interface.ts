export interface LocationModuleProps {
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

export interface LocationInterestsResponse {
  categories: TravelInterestCategory[]
}

export interface LocationStore {
  step: number;
  setStep: (step: number) => void;
  destination: string;
  setDestination: (destination: string) => void;
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
}