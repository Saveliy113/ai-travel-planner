import { AxiosError } from "axios"

import { AppError } from "@/shared/errors/AppError"

export function normalizeApiError(error: unknown): Error {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { errMsg?: string; message?: string }
      | undefined
    const msg = data?.errMsg || data?.message || "Request failed"

    return new AppError(msg)
  }

  return new AppError("Unknown error")
}
