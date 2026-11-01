import { NextResponse } from "next/server";
import type { z } from "zod";

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

// Turn the first zod issue into a readable message like
// "platforms.0.platform: Invalid platform: ..." (path omitted at the top level).
function formatIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue.path.join(".");
  return path && !issue.message.includes(path) ? `${path}: ${issue.message}` : issue.message;
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Parse and validate a JSON request body.
// Malformed JSON and schema failures both come back as 400s.
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S
): Promise<ParseResult<z.output<S>>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: badRequest("Request body must be valid JSON") };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, response: badRequest(formatIssue(result.error)) };
  }
  return { ok: true, data: result.data };
}

// Validate URL search params against a schema.
export function parseSearchParams<S extends z.ZodType>(
  params: URLSearchParams,
  schema: S
): ParseResult<z.output<S>> {
  const result = schema.safeParse(Object.fromEntries(params));
  if (!result.success) {
    return { ok: false, response: badRequest(formatIssue(result.error)) };
  }
  return { ok: true, data: result.data };
}

// Log the real error server-side but don't send database or upstream
// error text (which can include SQL and parameters) to the browser.
export function serverError(error: unknown) {
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}
