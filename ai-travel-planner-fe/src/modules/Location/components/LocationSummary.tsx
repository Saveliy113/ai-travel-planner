import { format, isValid, parse } from "date-fns"
import { CalendarRange, Compass, MapPin, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"
import { budgetLabelFromValue } from "@/modules/Location/model/scheme"
import { useLocationStore } from "@/modules/Location/store/location.store"

function formatYmd(ymd: string): string | null {
  if (!ymd.trim()) return null
  const d = parse(ymd, "yyyy-MM-dd", new Date())
  return isValid(d) ? format(d, "MMM d, yyyy") : null
}

export const LocationSummary = () => {
  const {
    step,
    destination,
    locationType,
    selectedClarification,
    selectedClarificationDescription,
    startDate,
    endDate,
    budget,
    selectedInterestLabels,
  } = useLocationStore()

  const startFmt = formatYmd(startDate)
  const endFmt = formatYmd(endDate)
  const budgetHuman = budget ? budgetLabelFromValue(budget) : null

  const dateLine =
    startFmt && endFmt
      ? `${startFmt} → ${endFmt}`
      : startFmt
        ? `From ${startFmt}`
        : endFmt
          ? `Until ${endFmt}`
          : null

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
            {destination ? (
              <p className="text-sm font-medium text-foreground">{destination}</p>
            ) : null}
            {locationType || selectedClarification ? (
              <p className="text-xs text-muted-foreground">
                {locationType}
                {selectedClarification ? (
                  <span className="text-foreground">
                    {locationType ? " · " : null}
                    <span className="font-medium">{selectedClarification}</span>
                  </span>
                ) : null}
              </p>
            ) : null}
            {selectedClarification ? (
              <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
                {selectedClarificationDescription}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {step >= 3 ? (
        <div
          className={cn(
            "rounded-2xl border border-black/10 bg-gradient-to-b from-white to-muted/40",
            "px-4 py-4 sm:px-5",
            "shadow-[0_12px_40px_-28px_rgba(0,0,0,0.35)]",
            "ring-1 ring-black/[0.04]"
          )}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Trip snapshot
          </p>
          <div
            className={cn(
              "mt-3 grid gap-3",
              dateLine && budgetHuman ? "sm:grid-cols-2" : "sm:max-w-sm"
            )}
          >
            {dateLine ? (
              <div
                className={cn(
                  "flex gap-3 rounded-xl border border-black/10 bg-white/90 px-3.5 py-3",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-muted/40">
                  <CalendarRange
                    className="size-4 text-primary"
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Dates
                  </p>
                  <p className="mt-0.5 text-sm font-medium leading-snug text-foreground">
                    {dateLine}
                  </p>
                </div>
              </div>
            ) : null}
            {budgetHuman ? (
              <div
                className={cn(
                  "flex gap-3 rounded-xl border border-black/10 bg-white/90 px-3.5 py-3",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-muted/40">
                  <Wallet className="size-4 text-primary" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Budget
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {budgetHuman}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 border-t border-black/10 pt-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Selected interests
            </p>
            {selectedInterestLabels.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-2" aria-label="Selected interests">
                {selectedInterestLabels.map((label) => (
                  <li key={label}>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border border-primary/35 bg-primary/[0.08] px-3 py-1",
                        "text-xs font-medium text-foreground"
                      )}
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                className={cn(
                  "mt-2.5 flex gap-3 rounded-xl border border-dashed border-black/15 bg-muted/15 px-3.5 py-4 sm:py-5"
                )}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white/90">
                  <Compass className="size-4 text-muted-foreground" aria-hidden />
                </span>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Pick at least one interest on step 3 — they anchor place search and day
                  layouts. Your choices appear here when selected.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
