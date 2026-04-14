CREATE TYPE "public"."delivery_status" AS ENUM('immediate', 'delayed', 'silenced');--> statement-breakpoint
ALTER TYPE "public"."priority_override" ADD VALUE 'essential';--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_focus_mode_enabled" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "delivery_status" "delivery_status" DEFAULT 'immediate';