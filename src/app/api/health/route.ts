import { db } from "@/db";
import { movies } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// This function runs when someone visits /api/health
// It tries to run a simple database query. If it works,
// the database connection is healthy.
export async function GET() {
  try {
    // Ask the database what time it is. This is the simplest
    // possible query — if this works, the connection is good.
    const result = await db.execute(sql`SELECT NOW()`);

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    // If the query fails, something is wrong with the connection.
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}