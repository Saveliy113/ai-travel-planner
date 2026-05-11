import { locationAgentApi } from "@/app/api/client"
import type { DestinationInterestsResponse } from "@/modules/TripSetup/model/tripSetup.interface"

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
