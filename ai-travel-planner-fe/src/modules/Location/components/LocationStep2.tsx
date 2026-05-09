import axios from "axios"
import { useState } from "react"
import { isBefore, parse, startOfDay } from "date-fns"
import { ArrowRight, Loader2 } from "lucide-react"

import { fetchLocationInterests } from "@/modules/Location/api/interests.api"
import { BUDGET_LEVEL_OPTIONS } from "@/modules/Location/model/scheme"
import { useLocationStore } from "@/modules/Location/store/location.store"
import { Button } from "@/shared/ui/button"
import { TripDatePicker } from "@/shared/ui/trip-date-picker"
import { cn } from "@/lib/utils"

/**
 * Step 2 — dates, budget, then fetch interest recommendations for the destination.
 */
export const LocationStep2 = () => {
  const {
    destination,
    startDate,
    endDate,
    budget,
    setStartDate,
    setEndDate,
    setBudget,
    setStep,
    setInterestCategories,
  } = useLocationStore()

  const [interestsPending, setInterestsPending] = useState(false)
  const [interestsError, setInterestsError] = useState<string | null>(null)

  const todayStart = startOfDay(new Date())
  const parsedStart = startDate ? parse(startDate, "yyyy-MM-dd", new Date()) : undefined

  const handleNext = async (): Promise<void> => {
    const dest = destination.trim()
    if (!dest || interestsPending) return
    setInterestsError(null)
    setInterestsPending(true)
    try {
      const data = await fetchLocationInterests(dest)
      setInterestCategories(data.categories)
      setStep(3)
    } catch (e) {
      let msg = "Could not load interests. Try again."
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as
          | { errMsg?: string; message?: string }
          | undefined
        msg = data?.errMsg ?? data?.message ?? e.message ?? msg
      } else if (e instanceof Error) {
        msg = e.message
      }
      setInterestsError(msg)
    } finally {
      setInterestsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step 2
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          Dates and budget
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Choose the dates and budget for your trip.
        </p>

        <div className="mt-3">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-3">
              <TripDatePicker
                id="trip-start-date"
                label="Start"
                placeholder="Pick start date"
                valueIso={startDate}
                disabled={(day) =>
                  isBefore(startOfDay(day), todayStart)}
                defaultMonth={
                  parsedStart ?? todayStart
                }
                onChangeIso={(iso) => {
                  setStartDate(iso)
                  const nextStart = iso
                  if (
                    nextStart &&
                    endDate &&
                    endDate < nextStart
                  ) {
                    setEndDate("")
                  }
                }}
              />
              <TripDatePicker
                id="trip-end-date"
                label="End"
                placeholder="Pick end date"
                valueIso={endDate}
                disabled={(day) =>
                  isBefore(
                    startOfDay(day),
                    parsedStart ?? todayStart
                  )}
                defaultMonth={
                  endDate ? parse(endDate, "yyyy-MM-dd", new Date()) : parsedStart ?? todayStart}
                onChangeIso={setEndDate}
              />
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Budget level
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pick what matches how you like to spend on the trip.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {BUDGET_LEVEL_OPTIONS.map(({ value, label, hint }) => {
                const selected = budget === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBudget(value)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border px-3.5 py-3 text-left transition-[background-color,border-color,box-shadow]",
                      selected
                        ? "border-primary/45 bg-primary/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-2 ring-primary/20"
                        : "border-black/12 bg-white hover:border-black/22 hover:bg-muted/40",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    )}
                  >
                    <span className="text-sm font-semibold tracking-tight text-foreground">{label}</span>
                    <span className="text-[0.6875rem] leading-snug text-muted-foreground">{hint}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {interestsError ? (
        <p className="text-sm text-destructive" role="alert">
          {interestsError}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-black/10 pt-4">
        <Button
          aria-busy={interestsPending}
          className="gap-1.5 rounded-full px-5 shadow-sm"
          disabled={interestsPending || !destination.trim()}
          onClick={() => void handleNext()}
          type="button"
        >
          {interestsPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading…
            </>
          ) : (
            <>
              Next
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
