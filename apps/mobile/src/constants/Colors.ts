const accent = "#00C2A8";
const accentDim = "#00A390";
const urgent = "#FF453A";
const normal = "#FF9F0A";
const low = "#32D74B";

export default {
  dark: {
    background: "#0A0D14",
    surface: "#141A29",
    surfaceElevated: "#1C2438",
    border: "#2A3650",
    text: "#FFFFFF",
    textSecondary: "#8A9BBE",
    textMuted: "#5C6B8A",
    tint: accent,
    tintDim: accentDim,
    tabIconDefault: "#5C6B8A",
    tabIconSelected: accent,
    urgent,
    normal,
    low,
    urgentBg: "rgba(255,69,58,0.15)",
    normalBg: "rgba(255,159,10,0.15)",
    lowBg: "rgba(50,215,75,0.15)",
    card: "#141A29",
    overlay: "rgba(0,0,0,0.6)",
  },
  light: {
    background: "#F0F4FF",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    border: "#E2E8F0",
    text: "#0A0E1A",
    textSecondary: "#4A5A7A",
    textMuted: "#8A9BBE",
    tint: accent,
    tintDim: accentDim,
    tabIconDefault: "#8A9BBE",
    tabIconSelected: accent,
    urgent,
    normal,
    low,
    urgentBg: "rgba(255,59,48,0.10)",
    normalBg: "rgba(255,149,0,0.10)",
    lowBg: "rgba(52,199,89,0.10)",
    card: "#FFFFFF",
    overlay: "rgba(0,0,0,0.4)",
  },
};
