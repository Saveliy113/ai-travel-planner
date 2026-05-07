import { locationApi } from "@/app/api"
import type { DestinationValidationResult } from "@/modules/Location/model/types"
import { normalizeApiError } from "@/shared/api/normalizeApiError"

export async function validateDestinationRequest(
  destination: string,
): Promise<DestinationValidationResult> {
  try {
    const { data } = await locationApi.post<DestinationValidationResult>(
      `/validation/destination`,
      { destination },
    )

    return data
  } catch (error) {
    throw normalizeApiError(error)
  }
}
