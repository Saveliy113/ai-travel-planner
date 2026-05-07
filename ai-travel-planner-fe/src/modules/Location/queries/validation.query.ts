import { useMutation } from "@tanstack/react-query"

import { validateDestinationRequest } from "@/modules/Location/api/validation"

export function useValidateDestinationQuery() {
  return useMutation({
    mutationFn: (destination: string) =>
      validateDestinationRequest(destination),
  })
}
