import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { syncDoctorToSupabase } from "@/lib/supabase-sync";
import { VALID_STAFF_ROLES } from "@/lib/constants";

// GET /api/doctors — list all medical & administrative staff accounts (Admin only)
export async function GET() {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Only administrators can view staff accounts." },
      { status: 403 }
    );
  }

  const doctors = await db.doctor.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ data: doctors });
}

// POST /api/doctors — create a new doctor/nurse/admin account (Admin only)
export async function POST(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Only administrators can add staff accounts." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const { username, name, role, password } = body;

  const cleanUsername = String(username || "").trim().toLowerCase();
  const cleanName = String(name || "").trim();
  const cleanRole = String(role || "doctor").trim().toLowerCase();
  const cleanPassword = String(password || "").trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 characters." },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9_.-]+$/.test(cleanUsername)) {
    return NextResponse.json(
      { error: "Username can only contain letters, numbers, dots, hyphens, and underscores." },
      { status: 400 }
    );
  }

  if (!cleanName || cleanName.length < 2) {
    return NextResponse.json(
      { error: "Full name is required (at least 2 characters)." },
      { status: 400 }
    );
  }

  if (!VALID_STAFF_ROLES.includes(cleanRole as any)) {
    return NextResponse.json(
      { error: "Invalid role. Role must be 'doctor_general', 'doctor_dental', 'doctor_eye', 'nurse', or 'admin'." },
      { status: 400 }
    );
  }

  if (!cleanPassword || cleanPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 }
    );
  }

  // Check uniqueness
  const existing = await db.doctor.findUnique({
    where: { username: cleanUsername },
  });
  if (existing) {
    return NextResponse.json(
      { error: `An account with username '${cleanUsername}' already exists.` },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(cleanPassword, 10);
  const newDoctor = await db.doctor.create({
    data: {
      username: cleanUsername,
      name: cleanName,
      role: cleanRole,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  await syncDoctorToSupabase({
    username: cleanUsername,
    password: hashedPassword,
    name: cleanName,
    role: cleanRole,
  }, "upsert");

  await logActivity(
    session.sub,
    "admin",
    "Created staff account",
    `${cleanName} (@${cleanUsername}, role: ${cleanRole})`
  );

  return NextResponse.json({ success: true, doctor: newDoctor }, { status: 201 });
}
