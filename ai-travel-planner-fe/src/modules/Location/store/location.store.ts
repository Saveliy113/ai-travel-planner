import { create } from "zustand"

import type { DestinationClarificationOption, LocationStore, Phase } from "@/modules/Location/model/location.interface"

export const useLocationStore = create<LocationStore>((set) => ({
  step: 1,
  destination: "",
  firstStepPhase: "input",
  clarificationReason: "",
  clarificationOptions: [],
  selectedClarification: "",
  setStep: (step: number) => set({ step }),
  setDestination: (destination: string) => set({ destination }),
  setFirstStepPhase: (phase: Phase) => set({ firstStepPhase: phase }),
  setClarificationReason: (reason: string) => set({ clarificationReason: reason }),
  setClarificationOptions: (options: DestinationClarificationOption[]) => set({ clarificationOptions: options }),
  setSelectedClarification: (clarification: string) => set({ selectedClarification: clarification }),
}));