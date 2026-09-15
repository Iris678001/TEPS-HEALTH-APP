import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { checkupUpdateSchema, firstErrorMessage } from "@/lib/validation";
import { calculateBMI, mergeStationRemarks } from "@/lib/helpers";
import { syncCheckupToSupabase } from "@/lib/supabase-sync";

type Ctx = { params: Promise<{ id: string }> };

function mergeDoctorNames(existingName: string, incomingName?: string): string {
  const inc = (incomingName || "").trim();
  const ext = (existingName || "").trim();
  if (!inc) return ext;
  if (!ext) return inc;
  if (ext.toLowerCase().includes(inc.toLowerCase())) return ext;
  const merged = `${ext} · ${inc}`;
  return merged.length <= 100 ? merged : inc;
}

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

  const userRole = session.role.toLowerCase();
  const incoming = parsed.data;

  const dateToUse = incoming.checkupDate
    ? new Date(`${incoming.checkupDate}T00:00:00.000Z`)
    : existing.checkupDate;

  let updateData: Prisma.HealthCheckupUpdateInput = {
    checkupDate: dateToUse,
    doctorName: mergeDoctorNames(existing.doctorName, incoming.doctorName || session.name),
  };

  if (incoming.academicYear && incoming.academicYear !== existing.academicYear) {
    updateData.academicYear = incoming.academicYear;
  }

  const targetStation = (incoming as any).station || (userRole === "doctor_dental" ? "dental" : userRole === "doctor_eye" ? "eye" : "general");

  // 1. General / Vitals & ENT
  if (targetStation === "general" || userRole === "admin" || incoming.height !== undefined || incoming.weight !== undefined) {
    const h = incoming.height !== undefined ? incoming.height : existing.height;
    const w = incoming.weight !== undefined ? incoming.weight : existing.weight;
    updateData.height = h;
    updateData.weight = w;
    updateData.bmi = calculateBMI(w, h);
    if (incoming.bloodPressure !== undefined && incoming.bloodPressure !== "Pending Exam") {
      updateData.bloodPressure = incoming.bloodPressure;
    }
    if (incoming.nutritionalStatus !== undefined) {
      updateData.nutritionalStatus = incoming.nutritionalStatus;
    }
    if (incoming.entEars !== undefined) updateData.entEars = incoming.entEars;
    if (incoming.entNose !== undefined) updateData.entNose = incoming.entNose;
    if (incoming.entThroat !== undefined) updateData.entThroat = incoming.entThroat;
    if (incoming.entRemarks !== undefined) updateData.entRemarks = incoming.entRemarks;
  }

  // 2. Dental
  if (targetStation === "dental" || userRole === "admin") {
    if (incoming.dentalHealth !== undefined && incoming.dentalHealth !== "Pending Exam" && incoming.dentalHealth !== "Pending") {
      updateData.dentalHealth = incoming.dentalHealth;
    }
  }

  // 3. Eye / Vision
  if (targetStation === "eye" || userRole === "admin") {
    if (incoming.eyesightLeft !== undefined && incoming.eyesightLeft !== "Pending Exam" && incoming.eyesightLeft !== "Pending") {
      updateData.eyesightLeft = incoming.eyesightLeft;
    }
    if (incoming.eyesightRight !== undefined && incoming.eyesightRight !== "Pending Exam" && incoming.eyesightRight !== "Pending") {
      updateData.eyesightRight = incoming.eyesightRight;
    }
  }

  // Station Remarks Attribution
  const stationRole = targetStation === "dental" ? "doctor_dental" : targetStation === "eye" ? "doctor_eye" : "doctor_general";
  if (incoming.nutritionRemarks !== undefined) {
    updateData.nutritionRemarks = mergeStationRemarks(
      existing.nutritionRemarks,
      incoming.nutritionRemarks,
      stationRole,
      incoming.doctorName || session.name
    );
  }

  try {
    const checkup = await db.healthCheckup.update({
      where: { id: numericId },
      data: updateData,
    });
    await syncCheckupToSupabase(checkup, "upsert");
    await logActivity(
      session.sub,
      session.role,
      "Updated health checkup",
      `${existing.admissionNumber} · AY ${checkup.academicYear} (${userRole})`
    );
    return NextResponse.json({ checkup });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: `A checkup for academic year ${incoming.academicYear || existing.academicYear} already exists for this student.` },
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
  await syncCheckupToSupabase(existing, "delete");
  await logActivity(
    session.sub,
    "doctor",
    "Deleted health checkup",
    `${existing.admissionNumber} · AY ${existing.academicYear}`
  );
  return NextResponse.json({ ok: true });
}
