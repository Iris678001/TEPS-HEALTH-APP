import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { firstErrorMessage, studentUpdateSchema } from "@/lib/validation";
import { syncStudentToSupabase } from "@/lib/supabase-sync";

type Ctx = { params: Promise<{ admissionNumber: string }> };

// GET /api/students/:admissionNumber — full profile
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { admissionNumber } = await ctx.params;
  const found = await db.student.findUnique({
    where: { admissionNumber },
    include: {
      checkups: { orderBy: { academicYear: "asc" } },
      observations: { orderBy: { createdAt: "desc" } },
      immunizations: { orderBy: { date: "desc" } },
      specialNeed: true,
      attachments: { orderBy: { uploadedDate: "desc" } },
    },
  });

  if (!found) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const { checkups, observations, immunizations, specialNeed, attachments, ...student } = found;

  return NextResponse.json({
    student,
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
  });
}

// PUT /api/students/:admissionNumber — update student info
export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { admissionNumber } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = studentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const existing = await db.student.findUnique({ where: { admissionNumber } });
  if (!existing) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const student = await db.student.update({
    where: { admissionNumber },
    data: { ...parsed.data, dob: new Date(`${parsed.data.dob}T00:00:00.000Z`) },
  });

  await syncStudentToSupabase(student, "upsert");

  await logActivity(
    session.sub,
    "doctor",
    "Updated student",
    `${student.admissionNumber} · ${student.studentName}`
  );

  return NextResponse.json({ student });
}

// DELETE /api/students/:admissionNumber (Admin only)
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Only administrators can delete student records." },
      { status: 403 }
    );
  }

  const { admissionNumber } = await ctx.params;
  const existing = await db.student.findUnique({ where: { admissionNumber } });
  if (!existing) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  await db.student.delete({ where: { admissionNumber } });
  await syncStudentToSupabase(existing, "delete");
  await logActivity(
    session.sub,
    "admin",
    "Deleted student",
    `${existing.admissionNumber} · ${existing.studentName}`
  );

  return NextResponse.json({ ok: true });
}
