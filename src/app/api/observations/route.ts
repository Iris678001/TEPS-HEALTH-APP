import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { firstErrorMessage, observationSchema } from "@/lib/validation";
import { syncObservationToSupabase } from "@/lib/supabase-sync";

// GET /api/observations?admissionNumber=...
export async function GET(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const admissionNumber = searchParams.get("admissionNumber");
  const where = admissionNumber ? { admissionNumber } : {};

  const observations = await db.observation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ data: observations });
}

// POST /api/observations
export async function POST(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = observationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const student = await db.student.findUnique({
    where: { admissionNumber: parsed.data.admissionNumber },
  });
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const observation = await db.observation.create({ data: parsed.data });
  await syncObservationToSupabase(observation, "upsert");
  await logActivity(
    session.sub,
    "doctor",
    "Added observation",
    `${parsed.data.admissionNumber} · AY ${parsed.data.academicYear}`
  );
  return NextResponse.json({ observation }, { status: 201 });
}
