import { Loader2, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

const ROTATE_MS = 7_000

const STATUS_LINES = [
  "Your plan is being generated…",
  "Fetching weather and local spots…",
  "Balancing pace, distance, and your preferences…",
  "Almost there — shaping your day-by-day itinerary…",
] as const

export interface PlanGeneratingOverlayProps {
  open: boolean
  className?: string
}

export function PlanGeneratingOverlay({ open, className }: PlanGeneratingOverlayProps) {
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    if (!open) {
      setLineIndex(0)
      return
    }
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % STATUS_LINES.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [open])

  const statusText = useMemo(() => STATUS_LINES[lineIndex], [lineIndex])

  if (!open) return null

  return createPortal(
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn("fixed inset-0 z-[200] flex items-center justify-center p-4", className)}
      role="alertdialog"
    >
      <div className="absolute inset-0 bg-background/55 backdrop-blur-md" />
      <div className="relative z-[1] flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-black/10 bg-white/90 px-8 py-10 text-center shadow-[0_24px_80px_-28px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex size-14 items-center justify-center">
            <span className="absolute inset-0 animate-pulse rounded-2xl bg-primary/15" aria-hidden />
            <span className="relative flex size-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Sparkles className="size-7" aria-hidden />
            </span>
          </div>
          <Loader2
            aria-hidden
            className="size-7 animate-spin text-primary/80 sm:size-8"
          />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold tracking-tight text-foreground">Hang tight</p>
          <p className="min-h-[3rem] text-sm leading-relaxed text-muted-foreground transition-opacity duration-300">
            {statusText}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          You can keep this tab open — we’ll move you to your plan when it’s ready.
        </p>
      </div>
    </div>,
    document.body
  )
}
