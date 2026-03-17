import {
  pgTable,
  serial,
  text,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  // Main content for the model to classify it
  title: text("title").notNull(),
  body: text("body").notNull(),
  // The source info
  senderName: text("sender_name"),
  appName: text("app_name").notNull(),
  packageName: text("package_name"),
  // The classification result (Model will fill those fields)
  category: text("category"), // (Urgent, Normal, Noise)
  confidence: doublePrecision("confidence"),
  // The time of the notification
  deviceTimestamp: timestamp("device_timestamp"), // When we receive it
  createdAt: timestamp("created_at").defaultNow(), // When we save it to the db
});
