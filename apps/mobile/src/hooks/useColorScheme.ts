import { useColorScheme as useRNColorScheme } from "react-native";
import { useAppStore } from "../store/appStore";

type ColorScheme = "dark" | "light";

/**
 * Returns the effective color scheme for the app.
 * If the user has set a manual override via Settings, that wins.
 * Otherwise falls back to the system (OS) preference.
 */
export function useColorScheme(): ColorScheme {
  const themeOverride = useAppStore((s) => s.themeOverride);
  const systemScheme = useRNColorScheme();

  if (themeOverride) return themeOverride;
  return systemScheme === "light" ? "light" : "dark";
}
