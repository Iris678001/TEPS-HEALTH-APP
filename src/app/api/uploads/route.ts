import { NextRequest, NextResponse } from "next/server";

// POST /api/uploads — Deprecated for doctors; document uploads are exclusively parent-driven
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "Document uploads are now managed exclusively by parents through the Parent Portal. Medical staff have view-only access to submitted records.",
    },
    { status: 403 }
  );
}
