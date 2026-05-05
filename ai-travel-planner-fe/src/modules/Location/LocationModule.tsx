import { cn } from "@/lib/utils"
import { DestinationStep } from "@/modules/Location/components/DestinationStep"

type LocationModuleProps = {
  className?: string
}

const LocationModule = ({ className }: LocationModuleProps) => {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-black/12 bg-white p-5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.18)] sm:p-6",
        className
      )}
    >
      <DestinationStep />
    </div>
  )
}

export default LocationModule
