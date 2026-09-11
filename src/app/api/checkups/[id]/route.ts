import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { checkupUpdateSchema, firstErrorMessage } from "@/lib/validation";
import { calculateBMI } from "@/lib/helpers";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/checkups/:id
export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid checkup id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = checkupUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const existing = await db.healthCheckup.findUnique({ where: { id: numericId } });
  if (!existing) {
    return NextResponse.json({ error: "Checkup not found." }, { status: 404 });
  }

  const { height, weight, ...rest } = parsed.data;

  try {
    const checkup = await db.healthCheckup.update({
      where: { id: numericId },
      data: {
        height,
        weight,
        bmi: calculateBMI(weight, height),
        ...rest,
        checkupDate: new Date(`${rest.checkupDate}T00:00:00.000Z`),
      },
    });
    await logActivity(
      session.sub,
      "doctor",
      "Updated health checkup",
      `${existing.admissionNumber} · AY ${checkup.academicYear}`
    );
    return NextResponse.json({ checkup });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: `A checkup for academic year ${rest.academicYear} already exists for this student.` },
        { status: 409 }
      );
    }
    throw e;
  }
}

// DELETE /api/checkups/:id
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid checkup id." }, { status: 400 });
  }

  const existing = await db.healthCheckup.findUnique({ where: { id: numericId } });
  if (!existing) {
    return NextResponse.json({ error: "Checkup not found." }, { status: 404 });
  }

  await db.healthCheckup.delete({ where: { id: numericId } });
  await logActivity(
    session.sub,
    "doctor",
    "Deleted health checkup",
    `${existing.admissionNumber} · AY ${existing.academicYear}`
  );
  return NextResponse.json({ ok: true });
}
