import { Compass } from "lucide-react"

import { cn } from "@/lib/utils"
import { useLocationStore } from "@/modules/Location/store/location.store"

/**
 * Step 3 — pick one or more interest categories from LLM recommendations.
 */
export const LocationStep3 = () => {
  const {
    interestCategories,
    selectedInterestLabels,
    toggleInterestSelection,
  } = useLocationStore()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step 3
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          Interests
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Choose what you want to explore — select as many as you like. These help
          tailor places and your future itinerary.
        </p>

        {interestCategories.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-black/15 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            No recommendations loaded. Go back to step 2 and tap{" "}
            <span className="font-medium text-foreground">Next</span> again.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {interestCategories.map((item) => {
              const selected = selectedInterestLabels.includes(item.label)
              return (
                <li key={`${item.label}::${item.searchQuery}`}>
                  <button
                    type="button"
                    onClick={() => toggleInterestSelection(item.label)}
                    className={cn(
                      "flex w-full flex-col items-start gap-1 rounded-xl border px-3.5 py-3 text-left transition-[background-color,border-color,box-shadow]",
                      selected
                        ? "border-primary/45 bg-primary/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-2 ring-primary/20"
                        : "border-black/12 bg-white hover:border-black/22 hover:bg-muted/40",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    )}
                  >
                    <span className="text-sm font-semibold tracking-tight text-foreground">
                      {item.label}
                    </span>
                    <span className="text-[0.6875rem] leading-snug text-muted-foreground">
                      {item.description}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-black/10 bg-muted/25 px-4 py-3",
          "text-xs leading-relaxed text-muted-foreground"
        )}
      >
        <Compass
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden
        />
        <p>
          Selected interests drive Google-style place searches and later day plans.
          You can always refine them in a future step.
        </p>
      </div>
    </div>
  )
}
