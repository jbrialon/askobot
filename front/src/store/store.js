import { create } from "zustand";

export const useStore = create((set) => ({
  scene: "live",
  isOBS: false,
  channel: null,
  setScene: (scene) => set({ scene }),
  setIsOBS: (isOBS) => set({ isOBS }),
  setChannel: (channel) => set({ channel }),
}));
