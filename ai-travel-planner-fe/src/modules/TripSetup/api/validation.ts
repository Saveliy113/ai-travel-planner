import { travelPlannerApi } from "@/app/api"
import type { DestinationValidationResult } from "@/modules/TripSetup/model/tripSetup.interface"
import { normalizeApiError } from "@/shared/api/normalizeApiError"

export async function validateDestinationRequest(
  destination: string,
): Promise<DestinationValidationResult> {
  try {
    const { data } = await travelPlannerApi.post<DestinationValidationResult>(
      `/validation/destination`,
      { destination },
    )

    return data
  } catch (error) {
    throw normalizeApiError(error)
  }
}
