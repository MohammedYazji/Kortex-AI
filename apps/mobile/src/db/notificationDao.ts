import { getDatabase } from "./database";
import type { AppStats, Category, Notification } from "../types";

// Saves a new notification with its AI classification into the database
export async function insertNotification(n: {
  appName: string;
  title: string | null;
  body: string;
  category: Category;
  isDelayed: number;
  confidence?: number;
}): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO notifications (appName, title, body, category, isDelayed, isRead, confidence)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [
      n.appName,
      n.title ?? null,
      n.body,
      n.category,
      n.isDelayed,
      n.confidence ?? 0.0,
    ],
  );
  return result.lastInsertRowId; // Returns the unique ID of the new notification
}

// Fetches the most recent 500 notifications for the history view
export async function getAllNotifications(): Promise<Notification[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Notification>(
    `SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 500`,
  );
}

// Fetches notifications by category (Urgent/Normal/Noise) that are NOT currently delayed
// For inbox page
export async function getByCategory(
  category: Category,
): Promise<Notification[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Notification>(
    `SELECT * FROM notifications WHERE category = ? AND isDelayed = 0 ORDER BY createdAt DESC LIMIT 200`,
    [category],
  );
}

// Fetches all notifications currently held in the 'Delayed' queue
// For delayed page
export async function getDelayed(): Promise<Notification[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Notification>(
    `SELECT * FROM notifications WHERE isDelayed = 1 ORDER BY createdAt DESC LIMIT 200`,
  );
}

// Updates a notification status to 'Read'
export async function markRead(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE notifications SET isRead = 1 WHERE id = ?`, [id]);
}

// Permanently removes a notification from the database
export async function deleteNotification(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM notifications WHERE id = ?`, [id]);
}

// Moves all 'Delayed' notifications to the 'Normal' inbox (Focus Mode Release)
export async function releaseDelayed(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE notifications SET isDelayed = 0 WHERE isDelayed = 1`,
  );
}

// Immediately releases one specific notification from the delayed queue
export async function releaseSingleDelayed(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE notifications SET isDelayed = 0 WHERE id = ?`, [
    id,
  ]);
}

// Wipes the entire notification history (Factory Reset)
export async function clearAll(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM notifications`);
}

// Calculates counts for each category to display on the Dashboard charts
export async function getStats(): Promise<AppStats> {
  const db = await getDatabase();
  // SQL Query groups by category but treats anything 'Delayed' as its own group
  const rows = await db.getAllAsync<{
    category: Category | "delayed";
    cnt: number;
  }>(
    `SELECT 
        CASE WHEN isDelayed = 1 THEN 'delayed' ELSE category END AS category,
        COUNT(*) as cnt
     FROM notifications
     GROUP BY CASE WHEN isDelayed = 1 THEN 'delayed' ELSE category END`,
  );

  const stats: AppStats = {
    urgent: 0,
    normal: 0,
    noise: 0,
    delayed: 0,
    total: 0,
  };

  // Map database rows to the AppStats object structure
  for (const row of rows) {
    if (row.category === "urgent") stats.urgent = row.cnt;
    else if (row.category === "normal") stats.normal = row.cnt;
    else if (row.category === "noise") stats.noise = row.cnt;
    else if (row.category === "delayed") stats.delayed = row.cnt;
  }

  // Calculate final total
  stats.total = stats.urgent + stats.normal + stats.noise + stats.delayed;
  return stats;
}

// Returns the total number of notifications ever processed (AI Inference Count)
export async function getTotalInferences(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM notifications`,
  );
  return row?.cnt ?? 0;
}
