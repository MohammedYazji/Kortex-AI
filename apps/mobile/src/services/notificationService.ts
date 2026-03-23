import { insertNotification } from "../db/notificationDao";
import { classify } from "./classifier";
import { useAppStore } from "../store/appStore";
import type { Category, Rule } from "../types";

// The shape of the final decision made for a single notification
export interface ProcessResult {
  category: Category; // What the AI (or rules) decided it was
  confidence: number; // How sure the AI was (0.0 to 1.0)
  isDelayed: boolean; // Should it be hidden until Focus Mode ends?
  isSilent: boolean; // Should the phone stay quiet?
}

/**
 * THE CORE PIPELINE: Classify → Apply Logic → Persist to Database.
 * * This is the business logic of Kortex. It follows these rules:
 * - Focus Mode ON:
 *      - URGENT: Stored normally, shown immediately.
 *      - NORMAL: Stored as 'Delayed', hidden from the user.
 *      - NOISE: Stored normally, but silenced (no alert).
 * - Focus Mode OFF:
 *      - Everything is stored normally and shown immediately.
 */
export async function processNotification(
  appName: string,
  title: string | null,
  body: string,
  rules: Rule[],
  focusMode: boolean,
): Promise<ProcessResult> {
  // 1. Run the Hybrid Classifier
  // This checks manual rules first, then the ONNX model, then keywords.
  const { category, confidence } = await classify(appName, title, body, rules);

  let isDelayed = false;
  let isSilent = false;

  // 2. STEP TWO: Apply "Focus Mode" routing logic
  if (focusMode) {
    if (category === "normal") {
      // Normal messages (like a casual text) are queued for later
      isDelayed = true;
      isSilent = true;
    } else if (category === "noise") {
      // Noise (like ads) is allowed in the inbox but shouldn't buzz the phone
      isSilent = true;
    }
    // Note: urgent will stay visible
  }

  // 3. Save to SQLite
  // We convert the boolean 'isDelayed' to a 1 or 0 for the SQL database.
  await insertNotification({
    appName,
    title,
    body,
    category,
    isDelayed: isDelayed ? 1 : 0,
    confidence,
  });

  // 4. Update the UI
  // We call the Zustand store to bump the version number.
  // This causes the Dashboard and Inbox screens to re-fetch their data instantly.
  await useAppStore.getState().notifyDataChanged();

  // Return the result so the background task knows whether to show a system alert
  return { category, confidence, isDelayed, isSilent };
}
