import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { firstErrorMessage, specialNeedSchema } from "@/lib/validation";

// PUT /api/special-needs — upsert the special needs record for a student
export async function PUT(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = specialNeedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const { admissionNumber, ...fields } = parsed.data;

  const student = await db.student.findUnique({ where: { admissionNumber } });
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  // Treat empty strings as null so the record stays clean
  const data = Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, v === "" ? null : v])
  );

  const specialNeed = await db.specialNeed.upsert({
    where: { admissionNumber },
    create: { admissionNumber, ...data },
    update: data,
  });

  await logActivity(session.sub, "doctor", "Updated special needs", admissionNumber);
  return NextResponse.json({ specialNeed });
}
