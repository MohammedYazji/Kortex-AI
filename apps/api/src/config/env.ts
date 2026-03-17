import dotenv from "dotenv";

// READ ENVIRONMENT VARIABLES
dotenv.config();

// EXPORT ENVIRONMENT VARIABLES AS OBJECT
export const config = {
  PORT: process.env.PORT || 3000,
};
