CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"sender_name" text,
	"app_name" text NOT NULL,
	"package_name" text,
	"category" text,
	"confidence" double precision,
	"device_timestamp" timestamp,
	"created_at" timestamp DEFAULT now()
);
