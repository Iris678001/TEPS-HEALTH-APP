import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDoctorSession, logActivity, unauthorized } from "@/lib/auth";
import { firstErrorMessage, immunizationUpdateSchema } from "@/lib/validation";
import { syncImmunizationToSupabase } from "@/lib/supabase-sync";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/immunizations/:id
export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid immunization id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = immunizationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstErrorMessage(parsed.error) }, { status: 400 });
  }

  const existing = await db.immunization.findUnique({ where: { id: numericId } });
  if (!existing) {
    return NextResponse.json({ error: "Immunization record not found." }, { status: 404 });
  }

  const { date, nextDue, ...rest } = parsed.data;
  const immunization = await db.immunization.update({
    where: { id: numericId },
    data: {
      date: new Date(`${date}T00:00:00.000Z`),
      nextDue: nextDue ? new Date(`${nextDue}T00:00:00.000Z`) : null,
      ...rest,
    },
  });
  await syncImmunizationToSupabase(immunization, "upsert");
  await logActivity(
    session.sub,
    "doctor",
    "Updated immunization",
    `${existing.admissionNumber} · ${immunization.vaccine}`
  );
  return NextResponse.json({ immunization });
}

// DELETE /api/immunizations/:id
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getDoctorSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid immunization id." }, { status: 400 });
  }

  const existing = await db.immunization.findUnique({ where: { id: numericId } });
  if (!existing) {
    return NextResponse.json({ error: "Immunization record not found." }, { status: 404 });
  }

  await db.immunization.delete({ where: { id: numericId } });
  await syncImmunizationToSupabase(existing, "delete");
  await logActivity(
    session.sub,
    "doctor",
    "Deleted immunization",
    `${existing.admissionNumber} · ${existing.vaccine}`
  );
  return NextResponse.json({ ok: true });
}
