import { useState } from "react"

import { cn } from "@/lib/utils"
import { DestinationStep } from "@/modules/Location/components/DestinationStep"
import { LocationStep2Template } from "@/modules/Location/components/LocationStep2Template"
import type {
  DestinationClarificationOption,
  DestinationValidationResult,
  LocationModuleProps,
} from "@/modules/Location/model/location.interface"

const LocationModule = ({ className }: LocationModuleProps) => {
  const [step, setStep] = useState<1 | 2>(1)
  const [step2Payload, setStep2Payload] = useState<{
    validation: DestinationValidationResult
    selectedClarification?: DestinationClarificationOption
  } | null>(null)

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-black/12 bg-white p-5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.18)] sm:p-6",
        className
      )}
    >
      {step === 1 ? (
        <DestinationStep
          onProceedToNextStep={(validation, selectedClarification) => {
            setStep2Payload({ validation, selectedClarification })
            setStep(2)
          }}
        />
      ) : step2Payload ? (
        <LocationStep2Template
          selectedClarification={step2Payload.selectedClarification}
          validation={step2Payload.validation}
        />
      ) : null}
    </div>
  )
}

export default LocationModule
