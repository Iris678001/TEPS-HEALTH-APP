import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import {
  getDoctorSession,
  logActivity,
  unauthorized,
  verifyParentToken,
} from "@/lib/auth";
import { UPLOAD_DIR, MIME_BY_EXT, extOf } from "@/lib/storage";

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

  try {
    const { readFile } = await import("fs/promises");
    const buffer = await readFile(path.join(UPLOAD_DIR, attachment.storedName));
    const ext = extOf(attachment.storedName);
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] || "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${attachment.filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "File is missing on disk. It may have been removed." },
      { status: 410 }
    );
  }
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

  await db.attachment.delete({ where: { id: numericId } });
  try {
    await unlink(path.join(UPLOAD_DIR, attachment.storedName));
  } catch {
    // file already gone from disk — ignore
  }

  await logActivity(
    session.sub,
    "doctor",
    "Deleted document",
    `${attachment.admissionNumber} · ${attachment.filename}`
  );
  return NextResponse.json({ ok: true });
}
