import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDoctorSession, unauthorized } from "@/lib/auth";

// GET /api/activity — paginated activity log (doctor only)
export async function GET(req: NextRequest) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "20", 10) || 20));

  const [total, data] = await Promise.all([
    db.activityLog.count(),
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: data.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
    total,
  });
}
