import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import dotenv from "dotenv";
import { config } from "../config/env";

dotenv.config();

const client = postgres(config.DATABASE_URL);
export const db = drizzle(client, { schema });
