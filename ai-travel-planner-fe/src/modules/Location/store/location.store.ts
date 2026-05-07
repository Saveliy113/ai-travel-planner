import { create } from "zustand"

import type { LocationStore } from "@/modules/Location/model/location.interface"

export const useLocationStore = create<LocationStore>((set) => ({
  destination: "",
  setDestination: (destination: string) => set({ destination }),
}))