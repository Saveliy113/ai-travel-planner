import { cn } from "@/lib/utils"
import LocationModule from "@/modules/Location/LocationModule"
import { HeroHeadingTypewriter } from "@/shared/ui/hero-heading-typewriter"

const HERO_EMOJIS = ["✈️", "🌍", "🗼", "🏖️", "🧳", "🌴", "🎒", "📍"] as const

const HERO_HEADING =
  "Create your best travel plan with AI Travel Assistant."

export const MainPage = () => {
  return (
    <div className="marketing-shell flex w-full min-h-0 flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex w-full max-w-3xl -translate-y-5 flex-col items-center gap-7 sm:-translate-y-10 sm:gap-9 md:-translate-y-14">
          <div
            aria-hidden
            className="flex max-w-full flex-wrap items-center justify-center gap-2 sm:gap-2.5"
          >
            {HERO_EMOJIS.map((emoji, index) => (
              <span
                className={cn(
                  "glass-emoji-bubble size-11 select-none text-[1.28rem]",
                  "transition-[transform,box-shadow] duration-300 ease-out",
                  "hover:scale-[1.07] hover:shadow-[0_12px_34px_rgba(99,102,241,0.18)]",
                  "sm:size-14 sm:text-[1.52rem]"
                )}
                key={`${emoji}-${index}`}
              >
                <span className="relative z-[1] leading-none">{emoji}</span>
              </span>
            ))}
          </div>

          <HeroHeadingTypewriter text={HERO_HEADING} />

          <div className="w-full max-w-xl">
            <LocationModule />
          </div>
        </div>
      </main>
    </div>
  )
}
