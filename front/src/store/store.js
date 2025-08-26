import { create } from "zustand";

export const useStore = create((set) => ({
  scene: null,
  isOBS: false,
  lightmode: false,
  setScene: (scene) => set({ scene }),
  setIsOBS: (isOBS) => set({ isOBS }),
  setLightmode: (lightmode) => set({ lightmode }),
}));
