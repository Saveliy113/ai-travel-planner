import { CompanyLogo } from "@/shared/ui/company-logo"

export const AppHeader = () => {
  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center border-b border-black/[0.06] bg-white/85 px-4 py-3 backdrop-blur-md sm:px-6">
      <CompanyLogo />
    </header>
  )
}
