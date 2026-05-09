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

export const BUDGET_LEVEL_OPTIONS = [
  { value: "economy", label: "Economy", hint: "Hostels · street food · public transit" },
  { value: "moderate", label: "Moderate", hint: "Mid-range stays · dine out sometimes" },
  { value: "comfort", label: "Comfort", hint: "Nicer hotels · flexible dining" },
  { value: "luxury", label: "Luxury", hint: "Premium stays · indulgent pace" },
] as const

export type BudgetLevelValue = (typeof BUDGET_LEVEL_OPTIONS)[number]["value"]

export function budgetLabelFromValue(value: string): string | undefined {
  const row = BUDGET_LEVEL_OPTIONS.find((o) => o.value === value)
  return row?.label
}