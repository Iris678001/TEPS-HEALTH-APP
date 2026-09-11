import { NextResponse } from "next/server";
import { getDoctorSession } from "@/lib/auth";
import { db } from "@/lib/db";

/** Returns the current doctor session, or { user: null } when signed out. */
export async function GET() {
  const session = await getDoctorSession();
  if (!session) return NextResponse.json({ user: null });

  const doctor = await db.doctor.findUnique({
    where: { username: session.sub },
    select: { id: true, username: true, name: true, role: true },
  });

  return NextResponse.json({ user: doctor });
}
