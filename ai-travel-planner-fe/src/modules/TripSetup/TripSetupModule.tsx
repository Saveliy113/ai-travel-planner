import { cn } from "@/lib/utils"
import { AdditionalPreferencesForm } from "@/modules/TripSetup/components/AdditionalPreferencesForm"
import { DatesBudgetForm } from "@/modules/TripSetup/components/DatesBudgetForm"
import { DestinationForm } from "@/modules/TripSetup/components/DestinationForm"
import { InterestsForm } from "@/modules/TripSetup/components/InterestsForm"
import { TripSetupSummary } from "@/modules/TripSetup/components/TripSetupSummary"
import type { TripSetupModuleProps } from "@/modules/TripSetup/model/tripSetup.interface"
import { useTripSetupStore } from "./store/tripSetup.store"

const TripSetupModule = ({ className }: TripSetupModuleProps) => {
  const { step } = useTripSetupStore()

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-black/12 bg-white p-5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.18)] sm:p-6",
        className
      )}
    >
      {step === 1 && <DestinationForm />}

      {step === 2 && <DatesBudgetForm />}

      {step === 3 && <InterestsForm />}

      {step === 4 && <AdditionalPreferencesForm />}

      {step >= 2 && (
        <div className="flex flex-col gap-6 mt-10">
          <TripSetupSummary />
        </div>
      )}
    </div>
  )
}

export default TripSetupModule
