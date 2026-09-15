import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { firstErrorMessage, immunizationSchema } from "@/lib/validation";
import { syncImmunizationToSupabase } from "@/lib/supabase-sync";

// GET /api/immunizations?admissionNumber=...
export async function GET(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const admissionNumber = searchParams.get("admissionNumber");
  const where = admissionNumber ? { admissionNumber } : {};

  const immunizations = await db.immunization.findMany({
    where,
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json({
    data: immunizations.map((i) => ({
      ...i,
      date: i.date.toISOString(),
      nextDue: i.nextDue ? i.nextDue.toISOString() : null,
    })),
  });
}

// POST /api/immunizations
export async function POST(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = immunizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const student = await db.student.findUnique({
    where: { admissionNumber: parsed.data.admissionNumber },
  });
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const { admissionNumber, date, nextDue, ...rest } = parsed.data;
  const immunization = await db.immunization.create({
    data: {
      admissionNumber,
      date: new Date(`${date}T00:00:00.000Z`),
      nextDue: nextDue ? new Date(`${nextDue}T00:00:00.000Z`) : null,
      ...rest,
    },
  });
  await syncImmunizationToSupabase(immunization, "upsert");
  await logActivity(
    session.sub,
    "doctor",
    "Added immunization",
    `${admissionNumber} · ${rest.vaccine} (${rest.dose})`
  );
  return NextResponse.json({ immunization }, { status: 201 });
}
