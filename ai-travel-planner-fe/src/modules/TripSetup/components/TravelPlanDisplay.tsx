import {
  CalendarRange,
  Cloud,
  Flame,
  Footprints,
  MapPin,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react"

import type { TravelPlanJson } from "@/modules/TripSetup/model/travel-plan-result.interface"
import { cn } from "@/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

export interface TravelPlanDisplayProps {
  plan: TravelPlanJson
  className?: string
}

const paceLabel: Record<string, string> = {
  light: "Light pace",
  moderate: "Balanced",
  active: "Active",
}

export function TravelPlanDisplay({ plan, className }: TravelPlanDisplayProps) {
  return (
    <div className={cn("flex w-full max-w-3xl flex-col gap-6", className)}>
      <Card className="overflow-hidden border-black/10 bg-white/95 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.15)]">
        <CardHeader className="border-b border-black/6 bg-gradient-to-br from-primary/[0.07] to-transparent pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your itinerary
              </p>
              <CardTitle className="text-xl sm:text-2xl">{plan.destination}</CardTitle>
              <CardDescription className="max-w-prose text-pretty">
                {plan.summary.tripStyle} · {plan.summary.weatherOverview}
              </CardDescription>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Sparkles aria-hidden className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.summary.planningLogic}</p>
        </CardHeader>
      </Card>

      <div className="flex flex-col gap-5">
        {plan.days.map((day) => (
          <Card
            className="overflow-hidden border-black/10 bg-white/95 shadow-[0_12px_40px_-22px_rgba(0,0,0,0.12)]"
            key={`${day.dayNumber}-${day.date}`}
          >
            <CardHeader className="space-y-3 border-b border-black/6 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-sm font-semibold text-primary">
                    {day.dayNumber}
                  </span>
                  <div>
                    <CardTitle className="text-base sm:text-lg">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarRange aria-hidden className="size-4 text-muted-foreground" />
                        {day.date}
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <MapPin aria-hidden className="size-3.5" />
                      {day.area}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Footprints aria-hidden className="size-3" />
                    {paceLabel[day.pace] ?? day.pace}
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-primary/25 text-primary">
                    <Cloud aria-hidden className="size-3" />
                    {day.weather.summary}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(day.weather.temperatureMin)}°–{Math.round(day.weather.temperatureMax)}° · Rain ~{" "}
                {day.weather.precipitationMm} mm
              </p>
            </CardHeader>

            <CardContent className="space-y-5 pt-4 sm:pt-5">
              <section>
                <h4 className="mb-2.5 flex items-center gap-2 text-sm font-semibold">
                  <Flame aria-hidden className="size-4 text-primary" />
                  Activities
                </h4>
                <ul className="space-y-3">
                  {day.activities.map((a, i) => (
                    <li
                      className="rounded-lg border border-black/8 bg-muted/30 p-3 sm:p-4"
                      key={`${a.title}-${i}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium leading-snug">{a.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {a.startTime} – {a.endTime} · {a.type}
                          </p>
                        </div>
                        {a.poi?.name ? (
                          <Badge variant="secondary" className="max-w-[12rem] truncate text-left">
                            {a.poi.name}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
                      {a.reasoning ? (
                        <p className="mt-2 text-xs italic text-muted-foreground">{a.reasoning}</p>
                      ) : null}
                      {a.tips?.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                          {a.tips.map((tip, j) => (
                            <li key={j}>{tip}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>

              {day.foodRecommendations?.length ? (
                <section>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <UtensilsCrossed aria-hidden className="size-4 text-primary" />
                    Food & drinks
                  </h4>
                  <ul className="space-y-2">
                    {day.foodRecommendations.map((f, i) => (
                      <li
                        className="flex flex-col gap-0.5 rounded-md border border-black/6 bg-white/80 px-3 py-2 text-sm"
                        key={`${f.name}-${i}`}
                      >
                        <span className="font-medium">
                          {f.name}{" "}
                          <span className="font-normal text-muted-foreground">({f.type})</span>
                        </span>
                        {f.reasoning ? (
                          <span className="text-xs text-muted-foreground">{f.reasoning}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {day.backupOptions?.length ? (
                <section>
                  <h4 className="mb-2 text-sm font-semibold">Backup options</h4>
                  <ul className="space-y-2 text-sm">
                    {day.backupOptions.map((b, i) => (
                      <li className="rounded-md bg-muted/50 px-3 py-2 text-muted-foreground" key={i}>
                        <span className="font-medium text-foreground">{b.condition}:</span> {b.alternative}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {day.dailyNotes?.length ? (
                <section className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Day notes</p>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    {day.dailyNotes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
