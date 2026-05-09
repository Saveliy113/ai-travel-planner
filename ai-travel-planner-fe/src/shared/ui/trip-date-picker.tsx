import type { Matcher } from "react-day-picker"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, parse, startOfDay } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"

export function TripDatePicker(props: {
  id: string
  label: string
  valueIso: string
  placeholder: string
  onChangeIso: (iso: string) => void
  disabled?: Matcher | Matcher[]
  /** Month shown first when opening (e.g. after the start date when picking end). */
  defaultMonth?: Date
}) {
  const {
    id,
    label,
    valueIso,
    placeholder,
    onChangeIso,
    disabled,
    defaultMonth,
  } = props

    const selected = valueIso ? parse(valueIso, "yyyy-MM-dd", new Date()) : undefined

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-auto min-h-10 w-full justify-start rounded-xl border-black/12 bg-white px-3.5 py-2.5 text-left text-[0.9375rem] font-normal whitespace-normal",
              "hover:border-black/20 hover:bg-white",
              "[&_svg]:text-muted-foreground",
              selected ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 size-4 shrink-0" aria-hidden />
            <span className={cn(!selected && "truncate")}>
              {selected ? format(selected, "MMM d, yyyy") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto rounded-xl border-black/12 p-0 shadow-md"
          align="start"
          sideOffset={8}
        >
          <Calendar
            mode="single"
            captionLayout="dropdown"
            className="rounded-xl"
            disabled={disabled}
            defaultMonth={
              selected ?? defaultMonth ?? startOfDay(new Date())
            }
            selected={selected}
            onSelect={(d) => {
              const next = d ? format(d, "yyyy-MM-dd") : ""
              onChangeIso(next)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
