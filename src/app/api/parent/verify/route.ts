import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createParentToken, logActivity } from "@/lib/auth";
import { firstErrorMessage, parentVerifySchema } from "@/lib/validation";

// Simple in-memory rate limiting: 10 attempts per IP per 10 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// POST /api/parent/verify — no account needed: admission number + date of birth
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = parentVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid admission number and date of birth." },
      { status: 400 }
    );
  }

  try {
    const { admissionNumber, dob } = parsed.data;
    const normalizedAdmissionNumber = admissionNumber.toUpperCase();
    
    const student = await db.student.findUnique({
      where: { admissionNumber: normalizedAdmissionNumber },
      include: {
        checkups: { orderBy: { academicYear: "asc" } },
        observations: { orderBy: { createdAt: "desc" } },
        immunizations: { orderBy: { date: "desc" } },
        specialNeed: true,
        attachments: { orderBy: { uploadedDate: "desc" } },
      },
    });

    // Generic error on any mismatch — never reveal which field was wrong
    if (!student || student.dob.toISOString().slice(0, 10) !== dob) {
      return NextResponse.json(
        {
          error:
            "No matching health record found. Please check the Admission Number and Date of Birth.",
        },
        { status: 404 }
      );
    }

    const token = await createParentToken(normalizedAdmissionNumber);
    await logActivity("parent", "parent", "Viewed health record", normalizedAdmissionNumber);

    const { checkups, observations, immunizations, specialNeed, attachments, ...base } = student;

    return NextResponse.json({
      token,
      profile: {
        student: base,
        checkups: checkups.map((c) => ({
          ...c,
          checkupDate: c.checkupDate.toISOString(),
        })),
        observations,
        immunizations: immunizations.map((i) => ({
          ...i,
          date: i.date.toISOString(),
          nextDue: i.nextDue ? i.nextDue.toISOString() : null,
        })),
        specialNeed,
        attachments,
      },
    });
  } catch (e: any) {
    console.error("Parent verify error:", e);
    return NextResponse.json(
      { error: "Server error", details: e.message, stack: e.stack },
      { status: 500 }
    );
  }
}
