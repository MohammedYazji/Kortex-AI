import { desc, eq, InferInsertModel, sql } from "drizzle-orm";
import { db } from "../db/database";
import { notifications } from "../db/schema";
import { pipeline, env } from "@xenova/transformers";
import path from "path";

console.log(__dirname);
// SO THE DATA MUST FIT THE SCHEMA WE DEFINED BEFORE
export type CreateNotificationInput = InferInsertModel<typeof notifications>;

const labelMap: Record<string, "urgent" | "normal" | "noise"> = {
  LABEL_0: "urgent",
  LABEL_1: "normal",
  LABEL_2: "noise",
};

export class NotificationService {
  private classifier: any = null;
  // CLASSIFY A SINGLE NOTIFICATION TEXT
  private async getClassifier() {
    if (!this.classifier) {
      env.localModelPath = path.resolve(__dirname, "../models/");
      env.allowRemoteModels = false;
      env.allowLocalModels = true;

      this.classifier = await pipeline("text-classification", "distilbert", {});
    }
    return this.classifier;
  }
  // CREATE A NEW NOTIFICATION
  async create(data: CreateNotificationInput) {
    const classifier = await this.getClassifier();
    const output = await classifier(data.body);
    const { label, score } = output[0];

    const finalData = {
      ...data,
      packageName: data.packageName || "com.kortex.internal",
      appName: data.appName || "Kortex Manual Test",
      senderName: data.senderName || "System Tester",
      category: labelMap[label as keyof typeof labelMap] || "normal",
      confidence: score,
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

  // DELETE A NOTIFICATION
  async delete(id: number) {
    const [deletedNotification] = await db
      .delete(notifications)
      .where(eq(notifications.id, id))
      .returning();

    return deletedNotification;
  }

  // CLEAR ALL NOTIFICATIONS
  async deleteAll() {
    // NOW AFTER WE MAKE CLEAR -- THE ID SERIAL WILL START AGAIN FROM 1
    return await db.execute(
      sql`TRUNCATE TABLE ${notifications} RESTART IDENTITY`,
    );
  }
}
