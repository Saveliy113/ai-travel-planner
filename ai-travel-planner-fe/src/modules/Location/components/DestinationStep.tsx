import { useState } from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  DESTINATION_SUGGESTIONS,
  destinationFieldId,
  destinationPlaceholder,
} from "@/modules/Location/model/scheme"
import { Button } from "@/shared/ui/button"

export const DestinationStep = () => {
  const [destination, setDestination] = useState("")

  return (
    <>
      <label className="sr-only" htmlFor={destinationFieldId}>
        Desired destination
      </label>
      <textarea
        autoComplete="off"
        className={cn(
          "min-h-[120px] w-full resize-none rounded-xl border border-black/12 bg-white px-4 py-3.5 text-[0.9375rem] leading-relaxed text-foreground shadow-none outline-none transition-[color,box-shadow]",
          "placeholder:text-neutral-400",
          "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25"
        )}
        id={destinationFieldId}
        name="destination"
        onChange={(e) => setDestination(e.target.value)}
        placeholder={destinationPlaceholder}
        value={destination}
      />

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

      <div className="mt-5 flex justify-end border-t border-black/10 pt-4">
        <Button className="gap-1.5 rounded-full px-5 shadow-sm" type="button">
          Next
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </>
  )
}
