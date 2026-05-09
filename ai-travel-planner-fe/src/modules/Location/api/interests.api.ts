import { locationAgentApi } from "@/app/api/client"
import type { LocationInterestsResponse } from "@/modules/Location/model/location.interface"

export async function fetchLocationInterests(
  destination: string
): Promise<LocationInterestsResponse> {
  const { data } = await locationAgentApi.post<LocationInterestsResponse>(
    "/location/interests",
    { destination }
  )
  return {
    categories: Array.isArray(data.categories) ? data.categories : [],
  }
}
