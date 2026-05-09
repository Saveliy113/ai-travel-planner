import { cn } from "@/lib/utils"
import {
  ADDITIONAL_PREFERENCES_SUGGESTIONS,
  additionalPreferencesFieldId,
} from "@/modules/Location/model/scheme"
import { useLocationStore } from "@/modules/Location/store/location.store"
import { Button } from "@/shared/ui/button"

function logWizardPayload(): void {
  const s = useLocationStore.getState()
  const payload = {
    step: s.step,
    destination: s.destination,
    locationType: s.locationType,
    firstStepPhase: s.firstStepPhase,
    clarificationReason: s.clarificationReason,
    clarificationOptions: s.clarificationOptions,
    selectedClarification: s.selectedClarification,
    selectedClarificationDescription: s.selectedClarificationDescription,
    startDate: s.startDate,
    endDate: s.endDate,
    budget: s.budget,
    interestCategories: s.interestCategories,
    selectedInterestLabels: s.selectedInterestLabels,
    selectedInterests: s.interestCategories.filter((c) =>
      s.selectedInterestLabels.includes(c.label)
    ),
    additionalPreferences: s.additionalPreferences,
  }
  console.log("[Create Plan] wizard payload", payload)
}

/**
 * Step 4 — free-text additional preferences for the planner.
 */
export const LocationStep4 = () => {
  const { additionalPreferences, setAdditionalPreferences } = useLocationStore()

  const appendSuggestion = (text: string): void => {
    const t = additionalPreferences.trim()
    setAdditionalPreferences(t ? `${t}; ${text}` : text)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step 4
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          Additional preferences
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Anything else we should know — pace, diet, accessibility, vibe, or must-avoid
          spots. Optional, but it helps fine-tune your plan.
        </p>

        <label className="sr-only" htmlFor={additionalPreferencesFieldId}>
          Additional preferences
        </label>
        <textarea
          id={additionalPreferencesFieldId}
          name="additionalPreferences"
          value={additionalPreferences}
          placeholder="e.g. We want slow mornings, love jazz bars, and want one full beach day…"
          className={cn(
            "mt-3 min-h-[120px] w-full resize-none rounded-xl border border-black/12 bg-white px-4 py-3.5 text-[0.9375rem] leading-relaxed text-foreground shadow-none outline-none transition-[color,box-shadow]",
            "placeholder:text-neutral-400",
            "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25"
          )}
          autoComplete="off"
          onChange={(e) => setAdditionalPreferences(e.target.value)}
        />
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Quick add</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ADDITIONAL_PREFERENCES_SUGGESTIONS.map((line) => (
            <button
              key={line}
              type="button"
              onClick={() => appendSuggestion(line)}
              className={cn(
                "rounded-full border border-black/15 bg-white px-3 py-1.5 text-left text-xs font-medium text-foreground",
                "transition-[background-color,box-shadow,color] hover:border-black/25 hover:bg-muted/60",
                "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
              )}
            >
              {line}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end border-t border-black/10 pt-4">
        <Button
          className="rounded-full px-6 shadow-sm"
          onClick={logWizardPayload}
          type="button"
        >
          Create Plan
        </Button>
      </div>
    </div>
  )
}
