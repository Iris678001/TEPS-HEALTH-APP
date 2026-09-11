import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { checkupSchema, firstErrorMessage } from "@/lib/validation";
import { calculateBMI } from "@/lib/helpers";

// POST /api/checkups — create an annual health checkup
export async function POST(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = checkupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const { admissionNumber, height, weight, ...rest } = parsed.data;

  const student = await db.student.findUnique({ where: { admissionNumber } });
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  try {
    const checkup = await db.healthCheckup.create({
      data: {
        admissionNumber,
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
      "Created health checkup",
      `${admissionNumber} · AY ${rest.academicYear}`
    );
    return NextResponse.json({ checkup }, { status: 201 });
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
