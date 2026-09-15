import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { handleCorsPreflight, applyCorsHeaders } from "@/lib/cors";

export async function middleware(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith("/api");

  // 1. Intercept OPTIONS preflight requests for all API routes
  if (isApi && request.method === "OPTIONS") {
    const preflight = handleCorsPreflight(request);
    if (preflight) return preflight;
  }

  // 2. Process request through Supabase session middleware
  let response: NextResponse;
  try {
    response = await createClient(request);
  } catch {
    response = NextResponse.next();
  }

  // 3. Attach CORS headers to all API route responses
  if (isApi) {
    return applyCorsHeaders(response, request);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (.svg, .png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

