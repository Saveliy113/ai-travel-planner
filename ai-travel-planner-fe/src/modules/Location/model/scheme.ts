export const DESTINATION_SUGGESTIONS = [
  "Tokyo",
  "Paris",
  "New York",
  "Barcelona",
  "Sydney",
  "Dubai",
  "Lisbon",
  "Seoul",
] as const

export type DestinationSuggestion = (typeof DESTINATION_SUGGESTIONS)[number]

export const destinationFieldId = "travel-destination" as const