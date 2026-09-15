import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyParentToken, logActivity } from "@/lib/auth";
import { firstErrorMessage, parentConditionsSchema } from "@/lib/validation";
import { syncSpecialNeedToSupabase } from "@/lib/supabase-sync";

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

// POST or PATCH /api/parent/conditions
// Enables verified parents to declare or update chronic conditions
// (Mental Illness, Epilepsy, Depression, Chronic Nephritis, Uremia, Infectious Disease)
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
  const parsed = parentConditionsSchema.safeParse(payloadWithToken);

  if (!parsed.success) {
    return NextResponse.json(
      { error: firstErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const { admissionNumber, conditions, additionalNotes } = parsed.data;

  // Cryptographically verify parent token
  const verifiedAdm = await verifyParentToken(token);
  if (!verifiedAdm || verifiedAdm !== admissionNumber) {
    return NextResponse.json(
      { error: "Unauthorized session or session expired. Please sign in again." },
      { status: 401 }
    );
  }

  // Ensure student exists
  const student = await db.student.findUnique({
    where: { admissionNumber },
  });
  if (!student) {
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  }

  // Build chronic illness string
  const cleanConditions = Array.from(
    new Set(
      conditions
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
    )
  );

  let formattedChronic: string | null = null;
  const conditionListStr = cleanConditions.join(", ");
  const trimmedNotes = additionalNotes?.trim() || "";

  if (conditionListStr && trimmedNotes) {
    formattedChronic = `${conditionListStr} (Notes: ${trimmedNotes})`;
  } else if (conditionListStr) {
    formattedChronic = conditionListStr;
  } else if (trimmedNotes) {
    formattedChronic = `Notes: ${trimmedNotes}`;
  } else {
    formattedChronic = null;
  }

  try {
    // Upsert SpecialNeed record in SQLite
    const updatedSpecialNeed = await db.specialNeed.upsert({
      where: { admissionNumber },
      update: {
        chronicIllness: formattedChronic,
      },
      create: {
        admissionNumber,
        chronicIllness: formattedChronic,
      },
    });

    // Synchronize to Supabase cloud in real time!
    await syncSpecialNeedToSupabase(updatedSpecialNeed, "upsert");

    // Audit log
    await logActivity(
      `Parent (${admissionNumber})`,
      "parent",
      "Declared chronic health conditions",
      `${student.studentName} (${admissionNumber}) · Conditions: ${formattedChronic || "None declared"}`
    );

    return NextResponse.json({
      success: true,
      specialNeed: {
        ...updatedSpecialNeed,
        updatedAt: updatedSpecialNeed.updatedAt.toISOString(),
      },
      message: cleanConditions.length > 0
        ? `Declared ${cleanConditions.length} health condition${cleanConditions.length > 1 ? "s" : ""} successfully.`
        : "Health conditions cleared successfully.",
    });
  } catch (err) {
    console.error("Error updating parent health conditions:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating health conditions." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
