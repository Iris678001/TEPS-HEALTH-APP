import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { MAX_UPLOAD_MB } from "@/lib/constants";
import { UPLOAD_DIR, MIME_BY_EXT, extOf } from "@/lib/storage";

// POST /api/uploads — multipart upload of a medical file for a student
export async function POST(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const file = form.get("file");
  const admissionNumber = String(form.get("admissionNumber") || "").trim();
  const category = String(form.get("category") || "Medical Report").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!admissionNumber) {
    return NextResponse.json({ error: "Admission number is required." }, { status: 400 });
  }

  const ext = extOf(file.name);
  if (!Object.keys(MIME_BY_EXT).includes(ext)) {
    return NextResponse.json(
      { error: "Only PDF, JPG and PNG files are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File is too large. Maximum size is ${MAX_UPLOAD_MB} MB.` },
      { status: 400 }
    );
  }

  const student = await db.student.findUnique({ where: { admissionNumber } });
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const storedName = `${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), bytes);

  const created = await db.attachment.create({
    data: {
      admissionNumber,
      filename: file.name.slice(0, 200),
      storedName,
      fileUrl: "",
      category: category.slice(0, 60) || "Medical Report",
    },
  });

  const attachment = await db.attachment.update({
    where: { id: created.id },
    data: { fileUrl: `/api/files/${created.id}` },
  });

  await logActivity(
    session.sub,
    "doctor",
    "Uploaded document",
    `${admissionNumber} · ${attachment.filename} (${attachment.category})`
  );

  return NextResponse.json({ attachment }, { status: 201 });
}
