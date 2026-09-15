import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getDoctorSession,
  logActivity,
  unauthorized,
  verifyParentToken,
} from "@/lib/auth";
import { SUPABASE_BUCKET } from "@/lib/storage";
import { supabaseAdmin } from "@/lib/supabase-sync";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/files/:id — doctor (cookie) or parent (short-lived token ?t=) access
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  const attachment = await db.attachment.findUnique({ where: { id: numericId } });
  if (!attachment) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  // Authorize: doctor session OR parent token scoped to this student
  const doctor = await getDoctorSession();
  if (!doctor) {
    const token = req.nextUrl.searchParams.get("t") || "";
    const adm = await verifyParentToken(token);
    if (!adm || adm !== attachment.admissionNumber) {
      return unauthorized();
    }
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

// DELETE /api/files/:id — doctor only
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  const attachment = await db.attachment.findUnique({ where: { id: numericId } });
  if (!attachment) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  // Delete database record first
  await db.attachment.delete({ where: { id: numericId } });

  // Delete from Supabase Storage (best-effort)
  if (supabaseAdmin) {
    const storagePath = `${attachment.admissionNumber}/${attachment.storedName}`;
    const { error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .remove([storagePath]);
    if (error) {
      console.error("Supabase Storage delete error:", error.message);
    }
  }

  await logActivity(
    session.sub,
    "doctor",
    "Deleted document",
    `${attachment.admissionNumber} · ${attachment.filename}`
  );
  return NextResponse.json({ ok: true });
}

