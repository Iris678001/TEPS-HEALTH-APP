import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const count = await db.student.count();
    return NextResponse.json({ status: "ok", db_connected: true, count });
  } catch (e: any) {
    return NextResponse.json({ status: "error", error: e.message, env_exists: !!process.env.DATABASE_URL }, { status: 500 });
  }
}
