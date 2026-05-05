import { TravelLogoMark } from "@/shared/ui/travel-logo-mark"

export const CompanyLogo = () => {
  return (
    <div
      aria-label="AI Travel Planner"
      className="flex min-w-0 items-center gap-3"
      role="group"
    >
      <div className="glass-logo-shell">
        <TravelLogoMark className="relative z-[1] size-9" />
      </div>
      <div className="min-w-0">
        <p className="font-bold leading-tight tracking-[-0.02em] text-foreground">
          <span className="text-[0.95rem]">AI </span>
          <span className="bg-gradient-to-r from-[#2563eb] via-[#6366f1] to-[#9333ea] bg-clip-text text-[0.95rem] text-transparent">
            Travel
          </span>
          <span className="text-[0.95rem]"> Planner</span>
        </p>
      </div>
    </div>
  )
}
