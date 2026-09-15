import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDoctorSession, unauthorized } from "@/lib/auth";
import { getCurrentAcademicYear } from "@/lib/helpers";
import { CLASSES } from "@/lib/constants";

// GET /api/dashboard — aggregated stats for the doctor dashboard
export async function GET() {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const currentAY = getCurrentAcademicYear();

  const [
    totalStudents,
    totalCheckups,
    checkupsThisYear,
    recentCheckups,
    abnormalCheckups,
    followUpObservations,
    allCheckups,
    students,
    currentYearCheckupsWithClass,
  ] = await Promise.all([
    db.student.count(),
    db.healthCheckup.count(),
    db.healthCheckup.findMany({
      where: { academicYear: currentAY },
      select: { admissionNumber: true },
    }),
    db.healthCheckup.findMany({
      orderBy: { checkupDate: "desc" },
      take: 6,
      include: { student: { select: { studentName: true, class: true, section: true } } },
    }),
    db.healthCheckup.findMany({
      where: { nutritionalStatus: { not: "Normal" } },
      orderBy: { checkupDate: "desc" },
      include: { student: { select: { studentName: true, class: true, section: true } } },
    }),
    db.observation.findMany({
      where: { recommendation: { not: "" } },
      orderBy: { createdAt: "desc" },
      include: { student: { select: { studentName: true, class: true, section: true } } },
    }),
    db.healthCheckup.findMany({
      orderBy: { checkupDate: "asc" },
      select: {
        admissionNumber: true,
        academicYear: true,
        checkupDate: true,
        nutritionalStatus: true,
      },
    }),
    db.student.findMany({ select: { admissionNumber: true, class: true } }),
    db.healthCheckup.findMany({
      where: { academicYear: currentAY },
      include: { student: { select: { class: true } } },
    }),
  ]);

  // Latest checkup per student → nutritional status distribution
  const latestByStudent = new Map<string, string>();
  for (const c of allCheckups) {
    latestByStudent.set(c.admissionNumber, c.nutritionalStatus);
  }
  const nutritionCounts = new Map<string, number>();
  for (const status of latestByStudent.values()) {
    nutritionCounts.set(status, (nutritionCounts.get(status) || 0) + 1);
  }
  const nutritionDistribution = [...nutritionCounts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Checkups by class for the current academic year vs total students per class
  const classOrder = (c: string) => {
    const idx = (CLASSES as readonly string[]).indexOf(c as any);
    return idx === -1 ? 99 : idx;
  };
  const classSet = [...new Set(students.map((s) => s.class))].sort(
    (a, b) => classOrder(a) - classOrder(b)
  );
  const studentsByClass = new Map<string, number>();
  for (const s of students) {
    studentsByClass.set(s.class, (studentsByClass.get(s.class) || 0) + 1);
  }
  const checkupsByClassMap = new Map<string, number>();
  for (const c of currentYearCheckupsWithClass) {
    checkupsByClassMap.set(c.student.class, (checkupsByClassMap.get(c.student.class) || 0) + 1);
  }
  const checkupsByClass = classSet.map((label) => ({
    label,
    checkups: checkupsByClassMap.get(label) || 0,
    students: studentsByClass.get(label) || 0,
  }));

  // Students needing follow-up (abnormal nutrition on latest checkup OR open recommendations)
  const followUpMap = new Map<
    string,
    { admissionNumber: string; studentName: string; class: string; section: string; reasons: Set<string> }
  >();
  const addToFollowUp = (
    adm: string,
    name: string,
    cls: string,
    sec: string,
    reason: string
  ) => {
    if (!followUpMap.has(adm)) {
      followUpMap.set(adm, {
        admissionNumber: adm,
        studentName: name,
        class: cls,
        section: sec,
        reasons: new Set(),
      });
    }
    followUpMap.get(adm)!.reasons.add(reason);
  };
  for (const c of abnormalCheckups) {
    if (latestByStudent.get(c.admissionNumber) !== c.nutritionalStatus) continue; // only latest
    addToFollowUp(
      c.admissionNumber,
      c.student.studentName,
      c.student.class,
      c.student.section,
      `Nutritional status: ${c.nutritionalStatus}`
    );
  }
  for (const o of followUpObservations) {
    addToFollowUp(
      o.admissionNumber,
      o.student.studentName,
      o.student.class,
      o.student.section,
      `Follow-up (${o.academicYear}): ${o.recommendation.slice(0, 90)}${o.recommendation.length > 90 ? "…" : ""}`
    );
  }
  const followUps = [...followUpMap.values()]
    .map((f) => ({ ...f, reasons: [...f.reasons] }))
    .sort((a, b) => a.studentName.localeCompare(b.studentName));

  return NextResponse.json({
    totalStudents,
    totalCheckups,
    currentAcademicYear: currentAY,
    pendingThisYear: totalStudents - new Set(checkupsThisYear.map((c) => c.admissionNumber)).size,
    followUpCount: followUps.length,
    followUps: followUps.slice(0, 10),
    recentCheckups: recentCheckups.map((c) => ({
      id: c.id,
      admissionNumber: c.admissionNumber,
      studentName: c.student.studentName,
      class: c.student.class,
      section: c.student.section,
      academicYear: c.academicYear,
      checkupDate: c.checkupDate.toISOString(),
      nutritionalStatus: c.nutritionalStatus,
      doctorName: c.doctorName,
    })),
    nutritionDistribution,
    checkupsByClass,
  });
}
