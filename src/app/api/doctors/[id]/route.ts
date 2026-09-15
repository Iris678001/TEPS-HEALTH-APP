import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { syncDoctorToSupabase } from "@/lib/supabase-sync";
import { VALID_STAFF_ROLES } from "@/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/doctors/:id — delete a staff member (Admin only)
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Only administrators can remove staff accounts." },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid staff ID." }, { status: 400 });
  }

  const existing = await db.doctor.findUnique({ where: { id: numericId } });
  if (!existing) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  if (existing.username === session.sub) {
    return NextResponse.json(
      { error: "You cannot delete your own active administrator account." },
      { status: 400 }
    );
  }

  if (existing.username === "admin") {
    return NextResponse.json(
      { error: "The primary system administrator account ('admin') cannot be deleted." },
      { status: 400 }
    );
  }

  await db.doctor.delete({ where: { id: numericId } });
  await syncDoctorToSupabase({ username: existing.username }, "delete");

  await logActivity(
    session.sub,
    "admin",
    "Deleted staff account",
    `${existing.name} (@${existing.username}, role: ${existing.role})`
  );

  return NextResponse.json({
    success: true,
    message: `Account for ${existing.name} (@${existing.username}) deleted successfully.`,
  });
}

// PATCH /api/doctors/:id — update name, role, or reset password (Admin only)
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Only administrators can update staff accounts." },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid staff ID." }, { status: 400 });
  }

  const existing = await db.doctor.findUnique({ where: { id: numericId } });
  if (!existing) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const updateData: { name?: string; role?: string; password?: string } = {};

  if (body.name !== undefined) {
    const cleanName = String(body.name).trim();
    if (cleanName.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }
    updateData.name = cleanName;
  }

  if (body.role !== undefined) {
    const cleanRole = String(body.role).trim().toLowerCase();
    if (!VALID_STAFF_ROLES.includes(cleanRole as any)) {
      return NextResponse.json(
        { error: "Invalid role. Role must be 'doctor_general', 'doctor_dental', 'doctor_eye', 'nurse', or 'admin'." },
        { status: 400 }
      );
    }
    if (existing.username === "admin" && cleanRole !== "admin") {
      return NextResponse.json(
        { error: "The primary 'admin' account cannot have its role changed." },
        { status: 400 }
      );
    }
    updateData.role = cleanRole;
  }

  if (body.password !== undefined) {
    const cleanPass = String(body.password).trim();
    if (cleanPass.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }
    updateData.password = await bcrypt.hash(cleanPass, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields provided to update." },
      { status: 400 }
    );
  }

  const updated = await db.doctor.update({
    where: { id: numericId },
    data: updateData,
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  await syncDoctorToSupabase({
    username: updated.username,
    name: updated.name,
    role: updated.role,
    password: updateData.password,
  }, "upsert");

  await logActivity(
    session.sub,
    "admin",
    "Updated staff account",
    `${updated.name} (@${updated.username}${body.password ? " · password reset" : ""})`
  );

  return NextResponse.json({ success: true, doctor: updated });
}

// PUT /api/doctors/:id — alias to PATCH
export const PUT = PATCH;
