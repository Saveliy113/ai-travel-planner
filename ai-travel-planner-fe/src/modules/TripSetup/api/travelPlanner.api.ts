import { itineraryAgentApi, locationAgentApi } from "@/app/api/client"
import type {
  DestinationInterestsResponse,
  TripSetupPlanPayload,
  TravelSetupGenerateResult,
} from "@/modules/TripSetup/model/tripSetup.interface"
import { normalizeApiError } from "@/shared/api/normalizeApiError"

export async function fetchDestinationInterests(
  destination: string
): Promise<DestinationInterestsResponse> {
  const { data } = await locationAgentApi.post<DestinationInterestsResponse>(
    "/location/interests",
    { destination }
  )
  return {
    categories: Array.isArray(data.categories) ? data.categories : [],
  }
}

/**
 * Creates a travel plan via itinerary agent `POST /travel-plan/generate`.
 * Maps `interests` to `selectedInterests` for the backend DTO.
 */
export async function generateTravelSetupPlan(
  payload: TripSetupPlanPayload
): Promise<TravelSetupGenerateResult> {
  try {
    const { data } = await itineraryAgentApi.post<TravelSetupGenerateResult>(
      "/travel-plan/generate",
      payload
    )

    return data
  } catch (e) {
    throw normalizeApiError(e)
  }
}
