import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyParentToken, logActivity } from "@/lib/auth";
import { firstErrorMessage, parentBloodGroupSchema } from "@/lib/validation";
import { syncStudentToSupabase } from "@/lib/supabase-sync";

// Rate limiting: 20 attempts per IP per 10 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// POST or PATCH /api/parent/blood-group
// Enables verified parents to declare or update their child's blood group,
// persisting in SQLite and instantly syncing to Supabase cloud.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few moments before trying again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // Token can come from payload or headers
  const token =
    body.token ||
    req.headers.get("x-parent-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const payloadWithToken = { ...body, token };
  const parsed = parentBloodGroupSchema.safeParse(payloadWithToken);

  if (!parsed.success) {
    return NextResponse.json(
      { error: firstErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const { admissionNumber, bloodGroup } = parsed.data;

  // Cryptographically verify parent token
  const verifiedAdm = await verifyParentToken(token);
  if (!verifiedAdm || verifiedAdm !== admissionNumber) {
    return NextResponse.json(
      { error: "Unauthorized session or session expired. Please sign in again." },
      { status: 401 }
    );
  }

  // Ensure student exists
  const existing = await db.student.findUnique({
    where: { admissionNumber },
  });
  if (!existing) {
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  }

  try {
    // Update locally in SQLite
    const updated = await db.student.update({
      where: { admissionNumber },
      data: { bloodGroup },
    });

    // Synchronize to Supabase cloud in real time!
    await syncStudentToSupabase(updated, "upsert");

    // Audit log
    await logActivity(
      `Parent (${admissionNumber})`,
      "parent",
      "Updated blood group",
      `${updated.studentName} (${admissionNumber}) · Blood group updated to ${bloodGroup}`
    );

    return NextResponse.json({
      success: true,
      student: {
        ...updated,
        dob: updated.dob.toISOString(),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      message: `Blood group successfully updated to ${bloodGroup}.`,
    });
  } catch (err) {
    console.error("Error updating parent blood group:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating the blood group." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
