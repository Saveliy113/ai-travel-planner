export type DestinationClarificationOption = {
  name: string
  description: string
}

export type DestinationValidationResult = {
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

/** POST /api/{version}/validation/destination */
export type ValidateDestinationRequestBody = {
  destination: string
}
