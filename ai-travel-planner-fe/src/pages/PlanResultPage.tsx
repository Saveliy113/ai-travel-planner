import { ChevronLeft } from "lucide-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { TravelPlanDisplay } from "@/modules/TripSetup/components/TravelPlanDisplay"
import { useTripResultStore } from "@/modules/TripSetup/store/tripResult.store"
import { Button } from "@/shared/ui/button"

export default function PlanResultPage() {
  const plan = useTripResultStore((s) => s.plan)
  const setPlan = useTripResultStore((s) => s.setPlan)
  const navigate = useNavigate()

  useEffect(() => {
    if (!plan) {
      navigate("/", { replace: true })
    }
  }, [plan, navigate])

  if (!plan) {
    return null
  }

  const goToHome = (): void => {
    setPlan(null)
    navigate("/")
  }

  return (
    <div className="marketing-shell flex w-full min-h-0 flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <div className="mb-8 flex w-full max-w-3xl shrink-0 justify-start">
          <Button
            className="gap-1 rounded-full px-4"
            onClick={goToHome}
            size="sm"
            type="button"
            variant="outline"
          >
            <ChevronLeft aria-hidden className="size-4" />
            Create new plan
          </Button>
        </div>
        <TravelPlanDisplay plan={plan} />
      </main>
    </div>
  )
}
