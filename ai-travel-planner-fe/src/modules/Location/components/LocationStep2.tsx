/**
 * Step 2 template — demo screen after destination / clarification.
 * Trip summary is rendered in LocationModule for step 2 and above.
 */
export const LocationStep2 = () => {
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
    </div>
  )
}
