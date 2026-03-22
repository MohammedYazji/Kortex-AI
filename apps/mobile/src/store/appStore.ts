import { create } from "zustand";

interface AppStore {
  themeOverride: "light" | "dark" | null;
}

export const useAppStore = create<AppStore>(() => ({
  themeOverride: null, // Default to system theme
}));
