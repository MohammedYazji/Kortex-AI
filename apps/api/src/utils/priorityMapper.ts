// CONVERT THE PRIORITY LEVEL INTO KORTEX CLASSIFICATION (URGENT, NORMAL, NOISE)
export function mapPreferenceToCategory(
  priorityLevel: string | null,
): string | null {
  switch (priorityLevel) {
    case "essential":
    case "high":
      return "urgent";
    case "low":
      return "noise";
    case "medium":
      return "normal";
    default:
      return null;
  }
}
