import { desc, eq, InferInsertModel } from "drizzle-orm";
import { db } from "../db/database";
import { notifications } from "../db/schema";

// SO THE DATA MUST FIT THE SCHEMA WE DEFINED BEFORE
export type CreateNotificationInput = InferInsertModel<typeof notifications>;

export class NotificationService {
  // CREATE A NEW NOTIFICATION
  async create(data: CreateNotificationInput) {
    // TO-DO: When Model get Ready Get (category, confidence) to pass with whole data
    const finalData = {
      ...data,
      packageName: data.packageName || "com.kortex.internal",
      appName: data.appName || "Kortex Manual Test",
      senderName: data.senderName || "System Tester",
      // TO-DO: PASS (category, confidence) HERE
    };

    const [newNotification] = await db
      .insert(notifications)
      .values(finalData)
      .returning();

    return newNotification;
  }

  // GET ALL NOTIFICATIONS
  async findAll() {
    return await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
  }

  // GET NOTIFICATION BY ID
  async findById(id: number) {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));

    return notification;
  }
}
