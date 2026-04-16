import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// neon() creates a connection to your Neon database
// using the connection string from your environment variables.
// drizzle() wraps that connection with the ORM, so you can
// write queries using TypeScript instead of raw SQL.
const sql = neon(process.env.DATABASE_URL!);

// The { schema } option tells Drizzle about your tables
// so it can provide type-safe queries.
export const db = drizzle(sql, { schema });