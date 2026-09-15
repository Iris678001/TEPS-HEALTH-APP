import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyParentToken, logActivity } from "@/lib/auth";
import { firstErrorMessage, parentCardDetailsSchema } from "@/lib/validation";
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

// Format 12-digit Aadhaar as "XXXX XXXX XXXX" if valid digits provided
function formatAadhaar(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  }
  return raw.trim() || null;
}

// POST or PATCH /api/parent/card-details
// Enables verified parents to update student card details:
// Aadhaar Card No., Identification Marks, Emergency Contact, Address, and Parent Name.
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
  const parsed = parentCardDetailsSchema.safeParse(payloadWithToken);

  if (!parsed.success) {
    return NextResponse.json(
      { error: firstErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const {
    admissionNumber,
    aadhaarNumber,
    parentName,
    phone,
    emergencyContact,
    address,
    identificationMarks,
  } = parsed.data;

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

  const formattedAadhaarVal = formatAadhaar(aadhaarNumber);

  try {
    // Update locally in SQLite
    const updated = await db.student.update({
      where: { admissionNumber },
      data: {
        parentName,
        phone,
        aadhaarNumber: formattedAadhaarVal,
        emergencyContact: emergencyContact || null,
        address: address || null,
        identificationMarks: identificationMarks || null,
      },
    });

    // Synchronize to Supabase cloud in real time!
    await syncStudentToSupabase(updated, "upsert");

    // Audit log
    const updatedItems: string[] = [];
    if (formattedAadhaarVal) updatedItems.push(`Aadhaar: ${formattedAadhaarVal}`);
    if (identificationMarks) updatedItems.push(`Marks: ${identificationMarks}`);
    if (emergencyContact) updatedItems.push(`Emergency: ${emergencyContact}`);
    if (address) updatedItems.push(`Address updated`);

    await logActivity(
      `Parent (${admissionNumber})`,
      "parent",
      "Updated student card details",
      `${updated.studentName} (${admissionNumber}) · ${updatedItems.join(", ") || "Updated identity info"}`
    );

    return NextResponse.json({
      success: true,
      student: {
        ...updated,
        dob: updated.dob.toISOString(),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      message: "Student card details successfully updated.",
    });
  } catch (err) {
    console.error("Error updating parent card details:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating card details." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
