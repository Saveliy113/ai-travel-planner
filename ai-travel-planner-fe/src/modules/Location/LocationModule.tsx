import { cn } from "@/lib/utils"
import { DestinationStep } from "@/modules/Location/components/DestinationStep"
import { LocationStep2 } from "@/modules/Location/components/LocationStep2"
import { LocationSummary } from "@/modules/Location/components/LocationSummary"
import type { LocationModuleProps } from "@/modules/Location/model/location.interface"
import { useLocationStore } from "./store/location.store"

const LocationModule = ({ className }: LocationModuleProps) => {
  const {
    step,
    destination,
    locationType,
    selectedClarification,
    selectedClarificationDescription,
  } = useLocationStore()

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-black/12 bg-white p-5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.18)] sm:p-6",
        className
      )}
    >
      {step === 1 && <DestinationStep />}

      {step === 2 && <LocationStep2 />}

      {step >= 2 && (
        <div className="flex flex-col gap-6">
          <LocationSummary
            destination={destination}
            locationType={locationType}
            selectedClarification={selectedClarification || undefined}
            selectedClarificationDescription={
              selectedClarificationDescription || undefined
            }
          />
        </div>
      )}
    </div>
  )
}

export default LocationModule
