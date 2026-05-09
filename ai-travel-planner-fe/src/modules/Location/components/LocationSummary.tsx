import { cn } from "@/lib/utils"
import { MapPin } from "lucide-react"

export interface LocationSummaryProps {
  destination: string
  locationType: string
  selectedClarification?: string
  selectedClarificationDescription?: string
  /** Shown when `destination` is empty */
  destinationPlaceholder?: string
  /** Shown when `locationType` is empty */
  locationTypePlaceholder?: string
  /** Placeholder for the dashed details section below the card */
  detailsPlaceholder?: string
}

const defaultDestinationPlaceholder = "Destination"
const defaultLocationTypePlaceholder = "Location type"
const defaultDetailsPlaceholder =
  "Dates, travelers, and more will appear here"

export const LocationSummary = ({
  destination,
  locationType,
  selectedClarification,
  selectedClarificationDescription,
  destinationPlaceholder = defaultDestinationPlaceholder,
  locationTypePlaceholder = defaultLocationTypePlaceholder,
  detailsPlaceholder = defaultDetailsPlaceholder,
}: LocationSummaryProps) => {
  const destinationLabel = destination.trim() || destinationPlaceholder
  const locationTypeLabel = locationType.trim() || locationTypePlaceholder

  return (
    <>
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
            <p
              className={cn(
                "text-sm font-medium",
                destination.trim()
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {destinationLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              {locationTypeLabel}
              {selectedClarification ? (
                <span className="text-foreground">
                  {" "}
                  ·{" "}
                  <span className="font-medium">
                    {selectedClarification}
                  </span>
                </span>
              ) : null}
            </p>
            {selectedClarification ? (
              <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
                {selectedClarificationDescription}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-black/15 bg-white/50 px-4 py-8 text-center text-sm text-muted-foreground">
        {detailsPlaceholder}
      </div>
    </>
  )
}
