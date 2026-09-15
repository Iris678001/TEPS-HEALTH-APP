import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { verifyParentToken, logActivity } from "@/lib/auth";
import { UPLOAD_DIR, MIME_BY_EXT, extOf } from "@/lib/storage";
import {
  syncAttachmentToSupabase,
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
    // Cloud storage fallback
    if (supabaseAdmin) {
      try {
        const storagePath = `${attachment.admissionNumber}/${attachment.storedName}`;
        const { data, error } = await supabaseAdmin.storage
          .from("health-records")
          .download(storagePath);
        if (!error && data) {
          const buffer = Buffer.from(await data.arrayBuffer());
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
        }
      } catch (cloudErr) {
        console.error("Supabase storage download fallback failed:", cloudErr);
      }
    }

    return NextResponse.json(
      { error: "File not found or no longer available." },
      { status: 410 }
    );
  }
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
    // 1. Delete from SQLite
    await db.attachment.delete({ where: { id: numericId } });

    // 2. Delete from local disk
    try {
      await unlink(path.join(UPLOAD_DIR, attachment.storedName));
    } catch {
      // ignore if missing on disk
    }

    // 3. Delete from Supabase Storage bucket 'health-records'
    await deleteFileFromSupabaseBucket(
      "health-records",
      `${attachment.admissionNumber}/${attachment.storedName}`
    );

    // 4. Sync deletion to Supabase cloud database
    await syncAttachmentToSupabase(attachment, "delete");

    // 5. Activity log
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
