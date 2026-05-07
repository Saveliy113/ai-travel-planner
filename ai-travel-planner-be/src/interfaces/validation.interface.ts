/**
 * Single suggested sublocation when clarification is useful for travel planning.
 */
interface DestinationClarificationOption {
  name: string;
  description: string;
}

/**
 * Destination validation result returned to API clients (aligned with LLM JSON shape, camelCase).
 */
interface DestinationValidationResult {
  isValidLocation: boolean;
  normalizedLocation: string;
  locationType: string;
  containsMultipleLocations: boolean;
  ambiguityDetected: boolean;
  clarificationRequired: boolean;
  clarificationReason: string;
  clarificationOptions: DestinationClarificationOption[];
  confidence: number;
}

export type { DestinationClarificationOption, DestinationValidationResult };
