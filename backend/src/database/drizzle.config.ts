import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { createEnv } from "./env";

const env = createEnv(process.env);

export default defineConfig({
  out: "./src/database/drizzle",
  schema: "./src/database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
