import { eq } from "drizzle-orm";
import { db } from "../db/database";
import { appSettings, notifications } from "../db/schema";
import { fa } from "zod/v4/locales";

export class SettingsService {
  // GET THE CURRENT SETTINGS
  public async getCurrentSettings() {
    // Try to get the settings
    let settings = await db.select().from(appSettings).limit(1);

    // If the settings still empty (make the default focus status)
    if (settings.length === 0) {
      const [newSettings] = await db
        .insert(appSettings)
        .values({
          id: 1,
          isFocusModeEnabled: false,
        })
        .returning();

      return newSettings;
    }
    // if the settings exists already return them
    return settings[0];
  }

  // Turn on - off the focus mode
  async toggleFocusMode(isEnabled: boolean) {
    // 1. Update the status in the settings table
    // I suppose we have just one row with one id
    await db
      .update(appSettings)
      .set({ isFocusModeEnabled: isEnabled, updatedAt: new Date() })
      .where(eq(appSettings.id, 1));

    // 2. If we end the focus phase so - Free all delayed notifications
    if (!isEnabled) {
      const released = await db
        .update(notifications)
        .set({ deliveryStatus: "immediate" })
        .where(eq(notifications.deliveryStatus, "delayed"))
        .returning();

      return {
        success: true,
        count: released.length,
        data: released,
      };
    }
    return { status: "active" };
  }
}

export const settingsService = new SettingsService();
