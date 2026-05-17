import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { TravelPlanDisplay } from "@/modules/TripSetup/components/TravelPlanDisplay"
import { useTripResultStore } from "@/modules/TripSetup/store/tripResult.store"

export default function PlanResultPage() {
  const plan = useTripResultStore((s) => s.plan)
  const navigate = useNavigate()

  useEffect(() => {
    if (!plan) {
      navigate("/", { replace: true })
    }
  }, [plan, navigate])

  if (!plan) {
    return null
  }

  return (
    <div className="marketing-shell flex w-full min-h-0 flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <TravelPlanDisplay plan={plan} />
      </main>
    </div>
  )
}
