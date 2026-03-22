import type { Category, Rule, RuleType } from "../types";
import { getDatabase } from "./database";

// Saves a new manual override rule (e.g., 'WhatsApp' should always be 'Urgent')
export async function insertRule(rule: {
  type: RuleType; // 'app' or 'contact'
  value: string; // The app package name or contact name
  forcedCategory: Category; // The category to force (urgent/normal/noise)
}): Promise<number> {
  const db = await getDatabase();
  // We trim and lowercase the value to ensure "WhatsApp" and "whatsapp" match correctly
  const result = await db.runAsync(
    `INSERT INTO rules (type, value, forcedCategory) VALUES (?, ?, ?)`,
    [rule.type, rule.value.trim().toLowerCase(), rule.forcedCategory],
  );
  return result.lastInsertRowId; // Returns the ID for UI state management
}

// Deletes a specific rule from the database using its ID
export async function deleteRule(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM rules WHERE id = ?`, [id]);
}

// Retrieves the full list of custom rules, sorted alphabetically for the Settings screen
// based on type app - contact
export async function getAllRules(): Promise<Rule[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Rule>(`SELECT * FROM rules ORDER BY type, value`);
}
