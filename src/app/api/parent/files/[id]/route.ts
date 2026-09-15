import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyParentToken, logActivity } from "@/lib/auth";
import { SUPABASE_BUCKET } from "@/lib/storage";
import {
  deleteFileFromSupabaseBucket,
  supabaseAdmin,
} from "@/lib/supabase-sync";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/parent/files/:id — Allows verified parents to view/download their ward's document
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  const token =
    req.nextUrl.searchParams.get("token") ||
    req.nextUrl.searchParams.get("t") ||
    req.headers.get("x-parent-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json(
      { error: "Parent authentication token required." },
      { status: 401 }
    );
  }

  const verifiedAdm = await verifyParentToken(token);
  if (!verifiedAdm) {
    return NextResponse.json(
      { error: "Unauthorized session or session expired." },
      { status: 401 }
    );
  }

  const attachment = await db.attachment.findUnique({ where: { id: numericId } });
  if (!attachment) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  // Ensure this parent owns this student's records (Ward Isolation)
  if (attachment.admissionNumber !== verifiedAdm) {
    return NextResponse.json(
      { error: "You are not authorized to view this document." },
      { status: 403 }
    );
  }

  // If fileUrl is already a full public URL (Supabase Storage), redirect directly
  if (attachment.fileUrl.startsWith("https://")) {
    return NextResponse.redirect(attachment.fileUrl);
  }

  // Fallback: generate a signed URL from Supabase Storage (5-minute expiry)
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "File storage is not configured." },
      { status: 503 }
    );
  }

  const storagePath = `${attachment.admissionNumber}/${attachment.storedName}`;
  const { data, error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .createSignedUrl(storagePath, 300); // 5 minutes

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "File not found or no longer available." },
      { status: 410 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}

// DELETE /api/parent/files/:id — Allows verified parents to delete their ward's document
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  const token =
    req.nextUrl.searchParams.get("token") ||
    req.headers.get("x-parent-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json(
      { error: "Parent authentication token required." },
      { status: 401 }
    );
  }

  const verifiedAdm = await verifyParentToken(token);
  if (!verifiedAdm) {
    return NextResponse.json(
      { error: "Unauthorized session or session expired." },
      { status: 401 }
    );
  }

  const attachment = await db.attachment.findUnique({ where: { id: numericId } });
  if (!attachment) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  // Ensure this parent owns this student's records
  if (attachment.admissionNumber !== verifiedAdm) {
    return NextResponse.json(
      { error: "You are not authorized to delete this document." },
      { status: 403 }
    );
  }

  try {
    // 1. Delete from database (Prisma → Supabase PostgreSQL)
    await db.attachment.delete({ where: { id: numericId } });

    // 2. Delete from Supabase Storage bucket
    await deleteFileFromSupabaseBucket(
      SUPABASE_BUCKET,
      `${attachment.admissionNumber}/${attachment.storedName}`
    );

    // 3. Activity log
    await logActivity(
      `Parent (${verifiedAdm})`,
      "parent",
      "Deleted document",
      `${attachment.admissionNumber} · ${attachment.filename}`
    );

    return NextResponse.json({ success: true, message: "Document deleted." });
  } catch (err) {
    console.error("Error deleting parent document:", err);
    return NextResponse.json(
      { error: "Failed to delete document." },
      { status: 500 }
    );
  }
}
