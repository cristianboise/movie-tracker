import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  // Where your schema file lives
  schema: "./src/db/schema.ts",

  // Where generated migration files will be saved
  out: "./drizzle",

  // We're using Postgres (via Neon)
  dialect: "postgresql",

  // Connection string from your .env.local
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});