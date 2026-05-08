import { create } from "zustand"

import type { DestinationClarificationOption, LocationStore, Phase } from "@/modules/Location/model/location.interface"

export const useLocationStore = create<LocationStore>((set) => ({
  step: 1,
  destination: "",
  locationType: "",
  firstStepPhase: "input",
  clarificationReason: "",
  clarificationOptions: [],
  selectedClarification: "",
  selectedClarificationDescription: "",
  setStep: (step: number) => set({ step }),
  setDestination: (destination: string) => set({ destination }),
  setFirstStepPhase: (phase: Phase) => set({ firstStepPhase: phase }),
  setClarificationReason: (reason: string) => set({ clarificationReason: reason }),
  setClarificationOptions: (options: DestinationClarificationOption[]) => set({ clarificationOptions: options }),
  setSelectedClarification: (clarification: string) => set({ selectedClarification: clarification }),
  setSelectedClarificationDescription: (description: string) => set({ selectedClarificationDescription: description }),
  setLocationType: (type: string) => set({ locationType: type }),
}));