import { create } from "zustand"

import type {
  DestinationClarificationOption,
  Phase,
  TravelInterestCategory,
  TripSetupStore,
} from "@/modules/TripSetup/model/tripSetup.interface"

export const useTripSetupStore = create<TripSetupStore>((set) => ({
  step: 1,
  destination: "",
  normalizedDestination: "",
  locationType: "",
  firstStepPhase: "input",
  clarificationReason: "",
  clarificationOptions: [],
  selectedClarification: "",
  selectedClarificationDescription: "",
  startDate: "",
  endDate: "",
  budget: "",
  interestCategories: [],
  selectedInterestLabels: [],
  additionalPreferences: "",
  setStep: (step: number) => set({ step }),
  setDestination: (destination: string) => set({ destination }),
  setNormalizedDestination: (destination: string) => set({ normalizedDestination: destination.trim() }),
  setFirstStepPhase: (phase: Phase) => set({ firstStepPhase: phase }),
  setClarificationReason: (reason: string) => set({ clarificationReason: reason }),
  setClarificationOptions: (options: DestinationClarificationOption[]) =>
    set({ clarificationOptions: options }),
  setSelectedClarification: (clarification: string) =>
    set({ selectedClarification: clarification }),
  setSelectedClarificationDescription: (description: string) =>
    set({ selectedClarificationDescription: description }),
  setLocationType: (type: string) => set({ locationType: type }),
  setStartDate: (date: string) => set({ startDate: date }),
  setEndDate: (date: string) => set({ endDate: date }),
  setBudget: (budget: string) => set({ budget: budget }),
  setInterestCategories: (categories: TravelInterestCategory[]) =>
    set({ interestCategories: categories, selectedInterestLabels: [] }),
  toggleInterestSelection: (label: string) =>
    set((state) => {
      const has = state.selectedInterestLabels.includes(label)
      return {
        selectedInterestLabels: has
          ? state.selectedInterestLabels.filter((l) => l !== label)
          : [...state.selectedInterestLabels, label],
      }
    }),
  setAdditionalPreferences: (additionalPreferences: string) =>
    set({ additionalPreferences }),
}));