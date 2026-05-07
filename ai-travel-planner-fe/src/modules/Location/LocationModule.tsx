import { cn } from "@/lib/utils"
import { DestinationStep } from "@/modules/Location/components/DestinationStep"
import { LocationStep2Template } from "@/modules/Location/components/LocationStep2Template"
import type { LocationModuleProps } from "@/modules/Location/model/location.interface"
import { useLocationStore } from "./store/location.store"

const LocationModule = ({ className }: LocationModuleProps) => {
  const { step, setStep } = useLocationStore()

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-black/12 bg-white p-5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.18)] sm:p-6",
        className
      )}
    >
      {step === 1 && (
        <DestinationStep />
      )}

      {step === 2 && (
        <LocationStep2Template
          validation={validation}
          selectedClarification={selectedClarification}
        />
      )}
    </div>
  )
}

export default LocationModule
