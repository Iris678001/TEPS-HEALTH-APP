import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { VALID_STAFF_ROLES } from "@/lib/constants";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "shrm-dev-secret-change-in-production"
);

export const SESSION_COOKIE = "shrm_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export interface TokenPayload {
  uid: number;
  sub: string; // username
  name: string;
  role: string;
}

// ─── Doctor session tokens ───────────────────────────────────────────────────

export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ uid: payload.uid, name: payload.name, role: payload.role, sub: payload.sub })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    // Disallow tokens without valid staff role or scoped to parent
    if (
      payload.scope === "parent" ||
      !payload.role ||
      !payload.sub ||
      payload.uid === undefined ||
      isNaN(Number(payload.uid))
    ) {
      return null;
    }
    const normalizedRole = String(payload.role).toLowerCase();
    if (!VALID_STAFF_ROLES.includes(normalizedRole as any)) {
      return null;
    }
    return {
      uid: Number(payload.uid),
      sub: String(payload.sub),
      name: String(payload.name),
      role: normalizedRole,
    };
  } catch {
    return null;
  }
}

/** Reads the httpOnly session cookie and returns the doctor session (or null). */
export async function getDoctorSession(): Promise<TokenPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized. Please sign in to continue." },
    { status: 401 }
  );
}

// ─── Parent access tokens (read-only, scoped to one admission number) ────────

export async function createParentToken(admissionNumber: string): Promise<string> {
  return new SignJWT({ adm: admissionNumber, scope: "parent" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(SECRET);
}

/** Returns the admission number the token is scoped to, or null. */
export async function verifyParentToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.scope !== "parent") return null;
    return String(payload.adm);
  } catch {
    return null;
  }
}

import { syncActivityLogToSupabase } from "./supabase-sync";

// ─── Activity logging ────────────────────────────────────────────────────────

export async function logActivity(actor: string, role: string, action: string, details: string) {
  try {
    await db.activityLog.create({ data: { actor, role, action, details } });
    await syncActivityLogToSupabase({ actor, role, action, details });
  } catch (e) {
    console.error("Failed to write activity log:", e);
  }
}
