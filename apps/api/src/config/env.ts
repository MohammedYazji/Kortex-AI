import dotenv from "dotenv";

// READ ENVIRONMENT VARIABLES
dotenv.config();

// EXPORT ENVIRONMENT VARIABLES AS OBJECT
export const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
};

if (!config.DATABASE_URL) {
  throw new Error("Database URL is not defined");
}
