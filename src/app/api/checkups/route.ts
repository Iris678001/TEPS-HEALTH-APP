import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { checkupSchema, firstErrorMessage } from "@/lib/validation";
import { calculateBMI, mergeStationRemarks } from "@/lib/helpers";
import { syncCheckupToSupabase } from "@/lib/supabase-sync";

function mergeDoctorNames(existingName: string, incomingName?: string): string {
  const inc = (incomingName || "").trim();
  const ext = (existingName || "").trim();
  if (!inc) return ext;
  if (!ext) return inc;
  if (ext.toLowerCase().includes(inc.toLowerCase())) return ext;
  const merged = `${ext} · ${inc}`;
  return merged.length <= 100 ? merged : inc;
}

// POST /api/checkups — create or merge an annual health checkup
export async function POST(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = checkupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const { admissionNumber, academicYear, checkupDate, height, weight, ...rest } = parsed.data;

  const student = await db.student.findUnique({ where: { admissionNumber } });
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const userRole = session.role.toLowerCase();

  // Check if checkup already exists for this student & academic year
  const existing = await db.healthCheckup.findUnique({
    where: {
      admissionNumber_academicYear: {
        admissionNumber,
        academicYear,
      },
    },
  });

  try {
    const targetStation = (parsed.data as any).station || (userRole === "doctor_dental" ? "dental" : userRole === "doctor_eye" ? "eye" : "general");

    if (existing) {
      // ─── Station Merge: Merge submitted station fields into existing record ───
      let updatePayload: Prisma.HealthCheckupUpdateInput = {
        checkupDate: new Date(`${checkupDate}T00:00:00.000Z`),
        doctorName: mergeDoctorNames(existing.doctorName, rest.doctorName || session.name),
      };

      // 1. General / Vitals & ENT
      if (targetStation === "general" || userRole === "admin" || height > 0 || weight > 0) {
        if (height > 0 || weight > 0) {
          const h = height > 0 ? height : existing.height;
          const w = weight > 0 ? weight : existing.weight;
          updatePayload.height = h;
          updatePayload.weight = w;
          updatePayload.bmi = calculateBMI(w, h);
        }
        if (rest.bloodPressure && rest.bloodPressure !== "Pending Exam" && rest.bloodPressure !== "Pending") {
          updatePayload.bloodPressure = rest.bloodPressure;
        }
        if (rest.nutritionalStatus) {
          updatePayload.nutritionalStatus = rest.nutritionalStatus;
        }
        if (rest.entEars !== undefined) updatePayload.entEars = rest.entEars;
        if (rest.entNose !== undefined) updatePayload.entNose = rest.entNose;
        if (rest.entThroat !== undefined) updatePayload.entThroat = rest.entThroat;
        if (rest.entRemarks !== undefined) updatePayload.entRemarks = rest.entRemarks;
      }

      // 2. Dental
      if (targetStation === "dental" || userRole === "admin") {
        if (rest.dentalHealth && rest.dentalHealth !== "Pending Exam" && rest.dentalHealth !== "Pending") {
          updatePayload.dentalHealth = rest.dentalHealth;
        }
      }

      // 3. Eye / Vision
      if (targetStation === "eye" || userRole === "admin") {
        if (rest.eyesightLeft && rest.eyesightLeft !== "Pending Exam" && rest.eyesightLeft !== "Pending") {
          updatePayload.eyesightLeft = rest.eyesightLeft;
        }
        if (rest.eyesightRight && rest.eyesightRight !== "Pending Exam" && rest.eyesightRight !== "Pending") {
          updatePayload.eyesightRight = rest.eyesightRight;
        }
      }

      // Station Remarks Attribution
      const stationRole = targetStation === "dental" ? "doctor_dental" : targetStation === "eye" ? "doctor_eye" : "doctor_general";
      if (rest.nutritionRemarks !== undefined) {
        updatePayload.nutritionRemarks = mergeStationRemarks(
          existing.nutritionRemarks,
          rest.nutritionRemarks,
          stationRole,
          rest.doctorName || session.name
        );
      }

      const updated = await db.healthCheckup.update({
        where: { id: existing.id },
        data: updatePayload,
      });

      await syncCheckupToSupabase(updated, "upsert");
      await logActivity(
        session.sub,
        session.role,
        "Updated health checkup station",
        `${admissionNumber} · AY ${academicYear} (${targetStation})`
      );

      return NextResponse.json({ checkup: updated, merged: true }, { status: 200 });
    }

    // ─── Initial Creation: Record first station with defaults for pending stations ───
    let createData: Prisma.HealthCheckupCreateInput;
    const baseDoctor = rest.doctorName || session.name;

    if (targetStation === "dental") {
      createData = {
        student: { connect: { admissionNumber } },
        academicYear,
        checkupDate: new Date(`${checkupDate}T00:00:00.000Z`),
        height: height || 0,
        weight: weight || 0,
        bmi: height > 0 && weight > 0 ? calculateBMI(weight, height) : 0,
        eyesightLeft: rest.eyesightLeft && rest.eyesightLeft !== "Pending" ? rest.eyesightLeft : "Pending Exam",
        eyesightRight: rest.eyesightRight && rest.eyesightRight !== "Pending" ? rest.eyesightRight : "Pending Exam",
        dentalHealth: rest.dentalHealth || "Healthy",
        bloodPressure: rest.bloodPressure && rest.bloodPressure !== "Pending" ? rest.bloodPressure : "Pending Exam",
        nutritionalStatus: rest.nutritionalStatus || "Normal",
        nutritionRemarks: mergeStationRemarks(null, rest.nutritionRemarks, "doctor_dental", baseDoctor),
        entEars: rest.entEars || "Pending Exam",
        entNose: rest.entNose || "Pending Exam",
        entThroat: rest.entThroat || "Pending Exam",
        entRemarks: rest.entRemarks || null,
        doctorName: `${baseDoctor} (Dental)`,
      };
    } else if (targetStation === "eye") {
      createData = {
        student: { connect: { admissionNumber } },
        academicYear,
        checkupDate: new Date(`${checkupDate}T00:00:00.000Z`),
        height: height || 0,
        weight: weight || 0,
        bmi: height > 0 && weight > 0 ? calculateBMI(weight, height) : 0,
        eyesightLeft: rest.eyesightLeft && rest.eyesightLeft !== "Pending" ? rest.eyesightLeft : "6/6",
        eyesightRight: rest.eyesightRight && rest.eyesightRight !== "Pending" ? rest.eyesightRight : "6/6",
        dentalHealth: rest.dentalHealth && rest.dentalHealth !== "Pending" ? rest.dentalHealth : "Pending Exam",
        bloodPressure: rest.bloodPressure && rest.bloodPressure !== "Pending" ? rest.bloodPressure : "Pending Exam",
        nutritionalStatus: rest.nutritionalStatus || "Normal",
        nutritionRemarks: mergeStationRemarks(null, rest.nutritionRemarks, "doctor_eye", baseDoctor),
        entEars: rest.entEars || "Pending Exam",
        entNose: rest.entNose || "Pending Exam",
        entThroat: rest.entThroat || "Pending Exam",
        entRemarks: rest.entRemarks || null,
        doctorName: `${baseDoctor} (Eye)`,
      };
    } else {
      // General Doctor, Nurse, Admin, or General Station
      createData = {
        student: { connect: { admissionNumber } },
        academicYear,
        checkupDate: new Date(`${checkupDate}T00:00:00.000Z`),
        height,
        weight,
        bmi: calculateBMI(weight, height),
        eyesightLeft: userRole === "admin" && rest.eyesightLeft && rest.eyesightLeft !== "Pending" && rest.eyesightLeft !== "Pending Exam" ? rest.eyesightLeft : "Pending Exam",
        eyesightRight: userRole === "admin" && rest.eyesightRight && rest.eyesightRight !== "Pending" && rest.eyesightRight !== "Pending Exam" ? rest.eyesightRight : "Pending Exam",
        dentalHealth: userRole === "admin" && rest.dentalHealth && rest.dentalHealth !== "Pending" && rest.dentalHealth !== "Pending Exam" ? rest.dentalHealth : "Pending Exam",
        bloodPressure: rest.bloodPressure && rest.bloodPressure !== "Pending" ? rest.bloodPressure : "Pending Exam",
        nutritionalStatus: rest.nutritionalStatus || "Normal",
        nutritionRemarks: userRole === "admin"
          ? (rest.nutritionRemarks || null)
          : mergeStationRemarks(null, rest.nutritionRemarks, "doctor_general", baseDoctor),
        entEars: rest.entEars || "Normal",
        entNose: rest.entNose || "Normal",
        entThroat: rest.entThroat || "Normal",
        entRemarks: rest.entRemarks || null,
        doctorName: baseDoctor,
      };
    }

    const checkup = await db.healthCheckup.create({
      data: createData,
    });

    await syncCheckupToSupabase(checkup, "upsert");
    await logActivity(
      session.sub,
      session.role,
      "Created health checkup",
      `${admissionNumber} · AY ${academicYear} (${userRole})`
    );

    return NextResponse.json({ checkup }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: `A checkup for academic year ${academicYear} already exists for this student.` },
        { status: 409 }
      );
    }
    throw e;
  }
}

