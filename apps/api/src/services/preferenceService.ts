import { eq, or } from "drizzle-orm";
import { db } from "../db/database";
import { userPreferences } from "../db/schema";

export class PreferenceService {
  // FIND SPECIFIC PRIORITY BASED ON SENDER OR APP NAME
  async getPriorityOverride(senderName?: string, packageName?: string) {
    if (!senderName && packageName) return null;

    const results = await db
      .select()
      .from(userPreferences)
      .where(
        or(
          senderName ? eq(userPreferences.entityName, senderName) : undefined,
          packageName ? eq(userPreferences.entityName, packageName) : undefined,
        ),
      )
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }
}

export const preferenceService = new PreferenceService();
