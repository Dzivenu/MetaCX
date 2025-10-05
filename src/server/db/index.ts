import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/shared/config/env";
import * as schema from "./schema";

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(env.DATABASE_URL, { prepare: false });

// Create drizzle instance
export const db = drizzle(client, { schema });
