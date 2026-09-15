import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { verifyParentToken, logActivity } from "@/lib/auth";
import { MAX_UPLOAD_MB } from "@/lib/constants";
import { SUPABASE_BUCKET, MIME_BY_EXT, extOf } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase-sync";

// Rate limiting: 20 uploads per IP per 10 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// POST /api/parent/uploads — Parent-only multipart upload for medical documents
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many upload attempts. Please wait a few moments before trying again." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form upload request." }, { status: 400 });
  }

  const file = form.get("file");
  const admissionNumber = String(form.get("admissionNumber") || "").trim();
  const category = String(form.get("category") || "Medical Report").trim();
  const token =
    String(form.get("token") || "").trim() ||
    req.headers.get("x-parent-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json(
      { error: "Parent authentication token required." },
      { status: 401 }
    );
  }

  // Cryptographically verify parent authorization
  const verifiedAdm = await verifyParentToken(token);
  if (!verifiedAdm || verifiedAdm !== admissionNumber) {
    return NextResponse.json(
      { error: "Unauthorized session or session expired. Please log in again." },
      { status: 401 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file selected." }, { status: 400 });
  }
  if (!admissionNumber) {
    return NextResponse.json({ error: "Admission number is required." }, { status: 400 });
  }

  const ext = extOf(file.name);
  if (!Object.keys(MIME_BY_EXT).includes(ext)) {
    return NextResponse.json(
      { error: "Only PDF, JPG, and PNG files are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File is too large. Maximum allowed size is ${MAX_UPLOAD_MB} MB.` },
      { status: 400 }
    );
  }

  const student = await db.student.findUnique({ where: { admissionNumber } });
  if (!student) {
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "File storage is not configured. Please contact the school administrator." },
      { status: 503 }
    );
  }

  try {
    const storedName = `${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";

    // Upload directly to Supabase Storage
    const storagePath = `${admissionNumber}/${storedName}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, bytes, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError.message);
      return NextResponse.json(
        { error: "Failed to upload the file. Please try again." },
        { status: 500 }
      );
    }

    // Get the public URL for this file
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(storagePath);
    const fileUrl = publicUrlData.publicUrl;

    // Save Attachment metadata to database (Prisma → Supabase PostgreSQL)
    const attachment = await db.attachment.create({
      data: {
        admissionNumber,
        filename: file.name.slice(0, 200),
        storedName,
        fileUrl,
        category: category.slice(0, 60) || "Medical Report",
      },
    });

    // Activity log
    await logActivity(
      `Parent (${admissionNumber})`,
      "parent",
      "Uploaded document",
      `${student.studentName} (${admissionNumber}) · ${attachment.filename} (${attachment.category})`
    );

    return NextResponse.json({ attachment, success: true }, { status: 201 });
  } catch (err) {
    console.error("Parent upload error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while uploading the document." },
      { status: 500 }
    );
  }
}

