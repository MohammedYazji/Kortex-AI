CREATE TYPE "public"."priority_override" AS ENUM('low', 'medium', 'high','essential');--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_name" text NOT NULL,
	"entity_type" text NOT NULL,
	"priority_level" "priority_override" DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
