import { cn } from "@/lib/utils"
import { useTypewriter } from "@/shared/hooks/useTypewriter"

const HERO_TYPEWRITER_MS = 72
const HERO_TYPEWRITER_DELAY_MS = 400

type HeroHeadingTypewriterProps = {
  className?: string
  text: string
}

export const HeroHeadingTypewriter = ({
  className,
  text,
}: HeroHeadingTypewriterProps) => {
  const { complete, displayed } = useTypewriter(
    text,
    HERO_TYPEWRITER_MS,
    HERO_TYPEWRITER_DELAY_MS
  )

  return (
    <h1
      aria-label={text}
      className={cn(
        "max-w-2xl text-center text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[2.35rem] md:leading-tight",
        className
      )}
    >
      <span>{displayed}</span>
      {!complete ? (
        <span aria-hidden className="typewriter-caret" />
      ) : null}
    </h1>
  )
}
