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
}