import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyParentToken, logActivity } from "@/lib/auth";
import { firstErrorMessage, parentVaccinesSchema } from "@/lib/validation";
import { syncImmunizationToSupabase } from "@/lib/supabase-sync";

// Rate limiting: 20 submissions per IP per 10 minutes
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

// POST /api/parent/immunizations
// Allows authenticated parents to record vaccines their ward has taken,
// persisting locally and backing up immediately to Supabase cloud.
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
  const parsed = parentVaccinesSchema.safeParse(payloadWithToken);

  if (!parsed.success) {
    return NextResponse.json(
      { error: firstErrorMessage(parsed.error) },
      { status: 400 }
    );
  }

  const { admissionNumber, vaccines } = parsed.data;

  // Verify parent token cryptographically
  const verifiedAdm = await verifyParentToken(token);
  if (!verifiedAdm || verifiedAdm !== admissionNumber) {
    return NextResponse.json(
      { error: "Session expired or unauthorized for this student. Please sign in again." },
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

  try {
    const createdList: Array<{ id: number; admissionNumber: string; vaccine: string; dose: string }> = [];

    for (const item of vaccines) {
      const recordDate = item.date
        ? new Date(`${item.date}T00:00:00.000Z`)
        : new Date();

      const remarksText = item.remarks
        ? `${item.remarks.trim()} (Declared by Parent)`
        : "Declared by Parent";

      const record = await db.immunization.create({
        data: {
          admissionNumber,
          vaccine: item.vaccine.trim(),
          date: recordDate,
          dose: item.dose || "Completed Primary",
          nextDue: null,
          remarks: remarksText,
        },
      });

      // Synchronize immediately to the Supabase cloud table Immunization
      await syncImmunizationToSupabase(record, "upsert");
      createdList.push(record);
    }

    // Audit log
    await logActivity(
      `Parent (${admissionNumber})`,
      "parent",
      "Declared vaccinations",
      `${student.studentName} (${admissionNumber}) · ${createdList.length} vaccine(s): ${createdList.map((c) => c.vaccine).join(", ")}`
    );

    // Fetch the updated list for immediate client view refresh
    const allImmunizations = await db.immunization.findMany({
      where: { admissionNumber },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        count: createdList.length,
        message: `${createdList.length} vaccination record(s) saved successfully.`,
        immunizations: allImmunizations.map((i) => ({
          ...i,
          date: i.date.toISOString(),
          nextDue: i.nextDue ? i.nextDue.toISOString() : null,
        })),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating parent immunizations:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while saving vaccination records." },
      { status: 500 }
    );
  }
}
