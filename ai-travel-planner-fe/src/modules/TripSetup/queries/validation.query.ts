import { useMutation } from "@tanstack/react-query"

import { validateDestinationRequest } from "@/modules/TripSetup/api/validation"

export function useValidateDestinationQuery() {
  return useMutation({
    mutationFn: (destination: string) =>
      validateDestinationRequest(destination),
  })
}
