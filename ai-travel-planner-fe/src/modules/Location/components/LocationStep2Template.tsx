import type {
  DestinationClarificationOption,
  DestinationValidationResult,
} from "@/modules/Location/model/types"
import { cn } from "@/lib/utils"
import { MapPin } from "lucide-react"

type LocationStep2TemplateProps = {
  validation: DestinationValidationResult
  selectedClarification?: DestinationClarificationOption
}

/**
 * Step 2 template — demo screen after destination / clarification.
 */
export const LocationStep2Template = ({
  validation,
  selectedClarification,
}: LocationStep2TemplateProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step 2
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          Plan your trip
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Dates, budget, and preferences will go here later. For now this
          placeholder shows the flow after validation.
        </p>
      </div>

      <div
        className={cn(
          "rounded-2xl border border-black/10 bg-muted/30 px-4 py-4 sm:px-5",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
              "border border-black/10 bg-white shadow-sm"
            )}
          >
            <MapPin className="size-4 text-primary" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">
              {validation.normalizedLocation}
            </p>
            <p className="text-xs text-muted-foreground">
              {validation.locationType}
              {selectedClarification ? (
                <span className="text-foreground">
                  {" "}
                  ·{" "}
                  <span className="font-medium">
                    {selectedClarification.name}
                  </span>
                </span>
              ) : null}
            </p>
            {selectedClarification ? (
              <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
                {selectedClarification.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-black/15 bg-white/50 px-4 py-8 text-center text-sm text-muted-foreground">
        Placeholder for step 2 (dates, travelers, and more)
      </div>
    </div>
  )
}
