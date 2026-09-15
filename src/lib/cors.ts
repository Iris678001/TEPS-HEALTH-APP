import { NextRequest, NextResponse } from "next/server";

/**
 * Parses allowed origins from environment variable or falls back to reflection.
 * CORS_ALLOWED_ORIGINS can be comma-separated: "https://school.edu,https://admin.school.edu"
 * If unset or "*", it dynamically reflects the caller origin to allow credentials.
 */
export function getAllowedOrigin(request: Request | NextRequest): string {
  const origin = request.headers.get("origin") || "";
  const configured = process.env.CORS_ALLOWED_ORIGINS?.trim();

  if (!configured || configured === "*") {
    return origin || "*";
  }

  const allowedList = configured.split(",").map((o) => o.trim().toLowerCase());
  if (origin && allowedList.includes(origin.toLowerCase())) {
    return origin;
  }

  // Fallback to first configured origin if not matching
  return allowedList[0] || "*";
}

/**
 * Returns standard CORS headers dictionary tailored to the incoming request.
 */
export function getCorsHeaders(request: Request | NextRequest): Record<string, string> {
  const allowOrigin = getAllowedOrigin(request);
  const isWildcard = allowOrigin === "*";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie, Cache-Control, Pragma, apikey, x-client-info, x-supabase-auth",
    "Access-Control-Expose-Headers":
      "Set-Cookie, Content-Disposition, Content-Length, Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  // W3C spec: Access-Control-Allow-Credentials cannot be 'true' if Origin is '*'
  if (!isWildcard) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

/**
 * Intercepts HTTP OPTIONS preflight requests and returns 204 No Content with CORS headers.
 */
export function handleCorsPreflight(request: Request | NextRequest): NextResponse | null {
  if (request.method !== "OPTIONS") {
    return null;
  }

  const corsHeaders = getCorsHeaders(request);
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Attaches CORS headers to an outgoing NextResponse.
 */
export function applyCorsHeaders(
  response: NextResponse,
  request: Request | NextRequest
): NextResponse {
  const corsHeaders = getCorsHeaders(request);
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}