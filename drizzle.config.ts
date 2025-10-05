import { defineConfig } from "drizzle-kit";
import { env } from "./src/shared/config/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
