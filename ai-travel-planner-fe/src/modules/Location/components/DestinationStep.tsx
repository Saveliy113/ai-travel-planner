import { ArrowRight, Info, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DESTINATION_SUGGESTIONS,
  destinationFieldId,
} from "@/modules/Location/model/scheme"
import { Button } from "@/shared/ui/button"
import { useValidateDestinationQuery } from "@/modules/Location/queries/validation.query"
import { useLocationStore } from "@/modules/Location/store/location.store"

export const DestinationStep = () => {
  const {
    firstStepPhase,
    destination,
    clarificationReason,
    setDestination,
    setStep,
    setClarificationReason,
    setFirstStepPhase,
    clarificationOptions,
    setClarificationOptions,
    selectedClarification,
    setSelectedClarification,
    setLocationType,
    setSelectedClarificationDescription,
  } = useLocationStore()

  const { mutate: validateDestination, isPending } = useValidateDestinationQuery()

  const handleDestinationSubmit = (): void => {
    // If phase is input, send request to validate destination
    if (firstStepPhase === "input") {
      validateDestination(destination.trim(), {
        onSuccess: (data) => {
          // If validation successfull (data.clarificationRequired is false),
          // proceed to next step
          if (!data.clarificationRequired) {
            setStep(2)
          }
          else {
            // If validation failed (data.clarificationRequired is true),
            // set clarification required and proceed to clarification step
            setLocationType(data.locationType)
            setClarificationReason(data.clarificationReason)
            setClarificationOptions(data.clarificationOptions)
            setFirstStepPhase("clarify")
          }
        },
      })
    }

    // If phase is clarify, proceed to next step
    if (firstStepPhase === "clarify") {
      setStep(2)
    }
  }

  return (
    <>
      {/* Main Destination input */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step 1
        </p>
        <h2 className="mt-1 mb-0 text-lg font-semibold tracking-tight text-foreground">
          Destination
        </h2>
        <p className="mt-0 mb-1 text-sm leading-relaxed text-muted-foreground">
          Enter the destination for your trip.
        </p>

        <label className="sr-only" htmlFor={destinationFieldId}>
          Desired destination
        </label>
        <textarea
          id={destinationFieldId}
          name="destination"
          value={destination}
          className={cn(
            "min-h-[120px] w-full resize-none rounded-xl border border-black/12 bg-white px-4 py-3.5 text-[0.9375rem] leading-relaxed text-foreground shadow-none outline-none transition-[color,box-shadow]",
            "placeholder:text-neutral-400",
            "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25",
            firstStepPhase === "clarify" && "cursor-default bg-muted/25 text-foreground/90"
          )}
          autoComplete="off"
          onChange={(e) => setDestination(e.target.value)}
          readOnly={firstStepPhase === "clarify"}
        />
        
      </div>

      {/* Destination suggestions */}
      {firstStepPhase === "input" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {DESTINATION_SUGGESTIONS.map((place) => (
            <button
              className={cn(
                "rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-medium text-foreground",
                "transition-[background-color,box-shadow,color] hover:border-black/25 hover:bg-muted/60",
                "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
              )}
              key={place}
              onClick={() => setDestination(place)}
              type="button"
            >
              {place}
            </button>
          ))}
        </div>
      ) : null}

      {/* Clarification info block with reason */}
      {firstStepPhase === "clarify" ? (
        <div className="mt-6 flex flex-col gap-5 border-t border-black/10 pt-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Clarification
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {destination}
            </p>
          </div>

          <div
            className={cn(
              "flex gap-3 rounded-r-2xl border border-black/8 border-l-4 border-l-primary/75",
              "bg-gradient-to-r from-primary/[0.07] via-primary/[0.03] to-transparent",
              "py-3.5 pl-3 pr-4"
            )}
            role="status"
          >
            <Info
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-primary">
                Why we&apos;re asking
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {clarificationReason}
              </p>
            </div>
          </div>

          {/* Clarification options */}
          {firstStepPhase === "clarify" && clarificationOptions.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Choose an option
              </p>
              <ul className="flex list-none flex-col gap-3 p-0">
                {clarificationOptions.map((option) => {
                  const isSelected = selectedClarification === option.name
                  return (
                    <li key={option.name}>
                      <button
                        className={cn(
                          "w-full rounded-2xl border-2 bg-white px-4 py-4 text-left",
                          "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] transition-[border-color,box-shadow,transform,background-color]",
                          "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none",
                          "active:scale-[0.99]",
                          isSelected
                            ? "border-primary bg-primary/[0.06] shadow-md ring-2 ring-primary/20"
                            : "border-black/12 hover:border-black/22 hover:bg-muted/35 hover:shadow-md"
                        )}
                        onClick={() => {
                          setSelectedClarification(option.name)
                          setSelectedClarificationDescription(option.description)
                        }}
                        type="button"
                      >
                        <span className="block font-semibold text-foreground">
                          {option.name}
                        </span>
                        <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-muted-foreground">
                          {option.description}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    
      <div
        className={cn(
          "flex justify-end",
          firstStepPhase === "input"
            ? "mt-5 border-t border-black/10 pt-4"
            : "mt-4 pt-1"
        )}
      >
        <Button
          aria-busy={firstStepPhase === "input" ? isPending : undefined}
          className="gap-1.5 rounded-full px-5 shadow-sm"
          disabled={
            firstStepPhase === "input"
              ? isPending || !destination.trim()
              : firstStepPhase === "clarify" && clarificationOptions.length > 0 && !selectedClarification
          }
          onClick={handleDestinationSubmit}
          type="button"
        >
          {firstStepPhase === "input" && isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading…
            </>
          ) : (
            <>
              {firstStepPhase === "input" ? "Next" : "Continue"}
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </>
  )
}
