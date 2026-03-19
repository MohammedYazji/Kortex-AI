import {
  pgTable,
  serial,
  text,
  timestamp,
  doublePrecision,
  pgEnum,
} from "drizzle-orm/pg-core";

// Define the priorities levels
export const priorityOverrideEnum = pgEnum("priority_override", [
  "low",
  "medium",
  "high",
  "essential",
]);

// Preferences Table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  entityName: text("entity_name").notNull(), // mom, or even com.whatsapp
  entityType: text("entity_type").notNull(), // app, sender, or keyword
  priorityLevel: priorityOverrideEnum("priority_level").default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  // Main content for the model to classify it
  title: text("title").notNull(),
  body: text("body").notNull(),
  // The source info
  senderName: text("sender_name"),
  appName: text("app_name").notNull(),
  packageName: text("package_name"), // TO-DO: Not null just for testing (to allow us make a new notification via the mobile app)
  // The classification result (Model will fill those fields)
  category: text("category"), // (Urgent, Normal, Noise)
  confidence: doublePrecision("confidence"),
  // The time of the notification
  deviceTimestamp: timestamp("device_timestamp"), // When we receive it
  createdAt: timestamp("created_at").defaultNow(), // When we save it to the db
});
