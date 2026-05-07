import { locationApi } from "@/app/api"
import type {
  DestinationValidationResult,
  ValidateDestinationRequestBody,
} from "@/modules/Location/api/types"
import { AxiosError } from "axios"

const apiVersion = (): string => import.meta.env.VITE_API_VERSION ?? "1.0"

/** Methods returned by {@link useValidationRequests}. */
export interface ValidationRequests {
  validateDestination: (
    destination: string,
  ) => Promise<DestinationValidationResult>
}

/**
 * Validation API group — POST `/api/{version}/validation/destination`
 */
export function useValidationRequests(): ValidationRequests {
  return {
    validateDestination: async (
      destination: string,
    ): Promise<DestinationValidationResult> => {
      try {
        const body: ValidateDestinationRequestBody = { destination }
        const { data } = await locationApi.post<DestinationValidationResult>(
          `/api/${apiVersion()}/validation/destination`,
          body,
        )
        return data
      } catch (error) {
        let errMsg = "Failed to validate destination"
        if (error instanceof AxiosError) {
          errMsg = error.response?.data?.errMsg || error.response?.data?.message;
        }

        throw new Error(errMsg)
      }
    },
  }
}
