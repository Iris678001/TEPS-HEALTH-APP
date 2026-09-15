import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { firstErrorMessage, observationUpdateSchema } from "@/lib/validation";
import { syncObservationToSupabase } from "@/lib/supabase-sync";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/observations/:id
export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid observation id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = observationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const existing = await db.observation.findUnique({ where: { id: numericId } });
  if (!existing) {
    return NextResponse.json({ error: "Observation not found." }, { status: 404 });
  }

  const observation = await db.observation.update({
    where: { id: numericId },
    data: parsed.data,
  });
  await syncObservationToSupabase(observation, "upsert");
  await logActivity(
    session.sub,
    "doctor",
    "Updated observation",
    `${existing.admissionNumber} · AY ${observation.academicYear}`
  );
  return NextResponse.json({ observation });
}

// DELETE /api/observations/:id
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid observation id." }, { status: 400 });
  }

  const existing = await db.observation.findUnique({ where: { id: numericId } });
  if (!existing) {
    return NextResponse.json({ error: "Observation not found." }, { status: 404 });
  }

  await db.observation.delete({ where: { id: numericId } });
  await syncObservationToSupabase(existing, "delete");
  await logActivity(
    session.sub,
    "doctor",
    "Deleted observation",
    `${existing.admissionNumber} · AY ${existing.academicYear}`
  );
  return NextResponse.json({ ok: true });
}
