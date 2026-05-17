import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { waitForItineraryPlan } from "@/modules/TripSetup/api/itineraryPlan.ws"
import { AdditionalPreferencesForm } from "@/modules/TripSetup/components/AdditionalPreferencesForm"
import { DatesBudgetForm } from "@/modules/TripSetup/components/DatesBudgetForm"
import { DestinationForm } from "@/modules/TripSetup/components/DestinationForm"
import { InterestsForm } from "@/modules/TripSetup/components/InterestsForm"
import { PlanGeneratingOverlay } from "@/modules/TripSetup/components/PlanGeneratingOverlay"
import { TripSetupSummary } from "@/modules/TripSetup/components/TripSetupSummary"
import { generateTravelSetupPlan } from "@/modules/TripSetup/api/travelPlanner.api"
import type { TripSetupModuleProps } from "@/modules/TripSetup/model/tripSetup.interface"
import { useTripResultStore } from "@/modules/TripSetup/store/tripResult.store"
import { Button } from "@/shared/ui/button"
import { useTripSetupStore } from "./store/tripSetup.store"

const TripSetupModule = ({ className }: TripSetupModuleProps) => {
  const tripSetupStore = useTripSetupStore()
  const setPlan = useTripResultStore((s) => s.setPlan)
  const navigate = useNavigate()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleCreatePlan = async (): Promise<void> => {
    setIsGenerating(true)
    try {
      const s = useTripSetupStore.getState()
      const { jobId } = await generateTravelSetupPlan({
        destination: `${s.normalizedDestination}${s.selectedClarification ? `, ${s.selectedClarification}` : ""}`,
        startDate: s.startDate,
        endDate: s.endDate,
        budget: s.budget,
        interests: s.interestCategories.filter((c) => s.selectedInterestLabels.includes(c.label)),
        additionalPreferences: s.additionalPreferences,
      })
      const plan = await waitForItineraryPlan(jobId)
      setPlan(plan)
      s.reset()
      navigate("/plan/result")
    } catch (error) {
      toast.error(String(error))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-black/12 bg-white p-5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.18)] sm:p-6",
        className
      )}
    >
      <PlanGeneratingOverlay open={isGenerating} />

      {tripSetupStore.step === 1 && <DestinationForm />}

      {tripSetupStore.step === 2 && <DatesBudgetForm />}

      {tripSetupStore.step === 3 && <InterestsForm />}


      {tripSetupStore.step === 4 && <AdditionalPreferencesForm />}

      {tripSetupStore.step === 4 ? (
        <div className="flex justify-end border-t border-black/10 pt-4">
          <Button
            className="rounded-full px-6 shadow-sm"
            onClick={handleCreatePlan}
            type="button"
          >
            Create Plan
          </Button>
        </div>
      ) : null}

      {tripSetupStore.step >= 2 && (
        <div className="flex flex-col gap-6 mt-10">
          <TripSetupSummary />
        </div>
      )}
    </div>
  )
}

export default TripSetupModule
