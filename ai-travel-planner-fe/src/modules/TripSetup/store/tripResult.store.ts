import { create } from "zustand"

import type { TravelPlanJson } from "@/modules/TripSetup/model/travel-plan-result.interface"

export interface TripResultStore {
  plan: TravelPlanJson | null
  setPlan: (plan: TravelPlanJson | null) => void
}

export const useTripResultStore = create<TripResultStore>((set) => ({
  plan: null,
  setPlan: (plan) => set({ plan }),
}))
