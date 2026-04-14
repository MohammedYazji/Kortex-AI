import { count, eq, sql } from "drizzle-orm";
import { db } from "../db/database";
import { notifications } from "../db/schema";

export class StatisticsService {
  // TO-DO: For future make it also daily or weekly not overall (or make separate methods for them)
  async getOverviewStats() {
    // 1. Get notifications of each class
    const distribution = await db
      .select({
        label: notifications.category,
        value: count(notifications.id),
      })
      .from(notifications)
      .groupBy(notifications.category);

    // 2. Calculate the notification count which delayed
    const savedFromDistraction = await db
      .select({ count: count() })
      .from(notifications)
      .where(sql`${notifications.category} != 'urgent'`);

    // Ensure the count is a number not a string
    const savedCount = Number(savedFromDistraction[0]?.count || 0);

    // 3. Get the Top 3 noisy apps
    const topDistractors = await db
      .select({
        appName: notifications.appName,
        noiseCount: count(),
      })
      .from(notifications)
      .where(eq(notifications.category, "noise"))
      .groupBy(notifications.appName)
      .orderBy(sql`count(*) DESC`)
      .limit(3);

    return {
      distribution,
      totalSaved: savedCount,
      topDistractors,
      estimatedFocusTime: savedCount * 2, // I Suppose each delayed or silent notification will saving two min
    };
  }
}

export const statisticsService = new StatisticsService();
