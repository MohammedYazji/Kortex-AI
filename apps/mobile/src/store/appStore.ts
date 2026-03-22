import { create } from "zustand"; // Import Zustand to create the global store
import { getStats, releaseDelayed } from "../db/notificationDao";
import { getAllRules } from "../db/rulesDao";
import { getFocusModeSetting, setFocusModeSetting } from "../db/database";
import type { AppStats, Rule } from "../types";

// Type for theme: null means follow the mobile system settings
type ThemeOverride = "dark" | "light" | null;

// The Blueprint for our global state
interface AppState {
  focusMode: boolean; // Is the AI currently delaying 'Normal' notifications?
  themeOverride: ThemeOverride; // Manual theme choice
  stats: AppStats; // Counts (Urgent, Normal, etc.) shown on the Dashboard
  rules: Rule[]; // List of user-defined bypass rules
  isLoading: boolean; // Global loading state for transitions
  notificationVersion: number; // A 'counter' used to force UI tabs to refresh data

  // Action: Switch Focus Mode and handle the 'Release' logic
  toggleFocusMode: () => Promise<void>;

  // Action: Cycle theme: System -> Dark -> Light -> System
  toggleTheme: () => void;

  refreshStats: () => Promise<void>; // Fetch latest counts from DB
  loadRules: () => Promise<void>; // Fetch all user rules from DB
  loadSettings: () => Promise<void>; // Load Focus Mode state from DB

  // Action: Call this whenever a new notification is added to refresh the UI
  notifyDataChanged: () => Promise<void>;
}

// Initial empty state for statistics
const defaultStats: AppStats = {
  urgent: 0,
  normal: 0,
  noise: 0,
  delayed: 0,
  total: 0,
};

// Create the actual Store hook (useAppStore)
export const useAppStore = create<AppState>((set, get) => ({
  focusMode: false,
  themeOverride: null,
  stats: defaultStats,
  rules: [],
  isLoading: false,
  notificationVersion: 0,

  // Handles switching Focus Mode ON/OFF
  toggleFocusMode: async () => {
    const current = get().focusMode;
    const next = !current;

    // Save the new setting to SQLite
    await setFocusModeSetting(next).catch(console.error);
    set({ focusMode: next });

    // Logical Trigger: If Focus Mode is turned OFF, 'release' all held notifications
    if (!next) {
      try {
        await releaseDelayed(); // SQL: UPDATE isDelayed = 0
        const stats = await getStats(); // Recalculate counts
        // Update state and increment version to trigger UI refresh
        set((state) => ({
          stats,
          notificationVersion: state.notificationVersion + 1,
        }));
      } catch (e) {
        console.error("[appStore] Error releasing notifications:", e);
      }
    }
  },

  // Simple logic to cycle through theme options
  toggleTheme: () => {
    const { themeOverride } = get();
    const next: ThemeOverride =
      themeOverride === null
        ? "dark"
        : themeOverride === "dark"
          ? "light"
          : null;
    set({ themeOverride: next });
  },

  // Fetches Focus Mode status from SQLite on app startup
  loadSettings: async () => {
    const focusMode = await getFocusModeSetting();
    set({ focusMode });
  },

  // Updates the dashboard numbers from the database
  refreshStats: async () => {
    const stats = await getStats();
    set({ stats });
  },

  // Loads user-defined override rules (like 'Mom' is always 'Urgent')
  loadRules: async () => {
    const rules = await getAllRules();
    set({ rules });
  },

  // The 'Refresh Trigger': Call this after any AI classification or DB write
  notifyDataChanged: async () => {
    const stats = await getStats();
    set((state) => ({
      stats,
      notificationVersion: state.notificationVersion + 1, // Bumping this notifies all UI screens
    }));
  },
}));
