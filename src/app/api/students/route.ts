import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { firstErrorMessage, studentSchema } from "@/lib/validation";
import { getCurrentAcademicYear } from "@/lib/helpers";

const SORTABLE = ["admissionNumber", "studentName", "class", "section", "dob"] as const;

// GET /api/students?q=&class=&section=&page=&pageSize=&sort=&dir=
export async function GET(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const classFilter = (searchParams.get("class") || "").trim();
  const sectionFilter = (searchParams.get("section") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get("pageSize") || "10", 10) || 10));
  const sortParam = searchParams.get("sort") || "admissionNumber";
  const sort = (SORTABLE as readonly string[]).includes(sortParam)
    ? (sortParam as (typeof SORTABLE)[number])
    : "admissionNumber";
  const dir = searchParams.get("dir") === "desc" ? "desc" : "asc";

  const where: Prisma.StudentWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { admissionNumber: { contains: q } },
              { studentName: { contains: q } },
              { parentName: { contains: q } },
            ],
          }
        : {},
      classFilter ? { class: classFilter } : {},
      sectionFilter ? { section: sectionFilter } : {},
    ],
  };

  const [total, students] = await Promise.all([
    db.student.count({ where }),
    db.student.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        checkups: {
          where: { academicYear: getCurrentAcademicYear() },
          select: { id: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    data: students.map((s) => ({
      admissionNumber: s.admissionNumber,
      studentName: s.studentName,
      class: s.class,
      section: s.section,
      gender: s.gender,
      dob: s.dob.toISOString(),
      bloodGroup: s.bloodGroup,
      parentName: s.parentName,
      phone: s.phone,
      hasRecordThisYear: s.checkups.length > 0,
      updatedAt: s.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

// POST /api/students — create a student (Admin only)
export async function POST(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Only administrators can register new students." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const exists = await db.student.findUnique({
    where: { admissionNumber: parsed.data.admissionNumber },
  });
  if (exists) {
    return NextResponse.json(
      { error: `A student with admission number ${parsed.data.admissionNumber} already exists.` },
      { status: 409 }
    );
  }

  const student = await db.student.create({
    data: { ...parsed.data, dob: new Date(`${parsed.data.dob}T00:00:00.000Z`) },
  });

  await logActivity(
    session.sub,
    "admin",
    "Created student",
    `${student.admissionNumber} · ${student.studentName}`
  );

  return NextResponse.json({ student }, { status: 201 });
}
