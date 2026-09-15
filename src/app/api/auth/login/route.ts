import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  createSessionToken,
  logActivity,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { loginSchema, firstErrorMessage } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const username = parsed.data.username.toLowerCase();
  const doctor = await db.doctor.findUnique({ where: { username } });

  if (!doctor || !(await bcrypt.compare(parsed.data.password, doctor.password))) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const token = await createSessionToken({
    uid: doctor.id,
    sub: doctor.username,
    name: doctor.name,
    role: doctor.role,
  });

  await logActivity(doctor.username, "doctor", "Signed in", "Doctor portal login");

  const res = NextResponse.json({
    user: {
      id: doctor.id,
      username: doctor.username,
      name: doctor.name,
      role: doctor.role,
    },
  });

  const isSecure =
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production" && req.headers.get("x-forwarded-proto") !== "http";

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return res;
}
