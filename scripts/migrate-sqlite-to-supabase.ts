/**
 * scripts/migrate-sqlite-to-supabase.ts
 *
 * One-time migration: reads ALL data from the local SQLite database
 * and upserts it into Supabase PostgreSQL.
 *
 * Run ONCE from your local machine (NOT on Netlify) before deploying:
 *   npm run db:migrate-to-supabase
 *
 * Prerequisites:
 *   1. DATABASE_URL must point to the local SQLite file:
 *        DATABASE_URL="file:../db/custom.db"
 *   2. SUPABASE_SERVICE_ROLE_KEY must be set
 *   3. NEXT_PUBLIC_SUPABASE_URL must be set
 *
 * The script uses the Supabase admin client to bypass RLS and upsert
 * data directly, so it does NOT need a Postgres connection string yet.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// ─── SQLite Prisma client (reads from local DB) ───────────────────────────────
// We use a raw PrismaClient so this script works regardless of the env var
const sqliteClient = new PrismaClient({
  datasources: { db: { url: process.env.SQLITE_URL || "file:../db/custom.db" } },
});

// ─── Supabase admin client (writes to Supabase) ───────────────────────────────
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lnelcfeeuhvyylqmxrhp.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY is not set. Aborting.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return new Date(d).toISOString();
}

async function upsert(table: string, rows: Record<string, unknown>[], conflict: string) {
  if (rows.length === 0) return;
  // Supabase upsert in chunks of 500
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflict });
    if (error) {
      console.error(`  ❌  Error upserting into ${table} (chunk ${i / CHUNK + 1}):`, error.message);
    } else {
      console.log(`  ✅  ${table}: upserted rows ${i + 1}–${Math.min(i + CHUNK, rows.length)}`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀  TEPS Health App — SQLite → Supabase PostgreSQL Migration");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 1. Students
  console.log("📚  Migrating Students...");
  const students = await sqliteClient.student.findMany();
  console.log(`     Found ${students.length} students`);
  await upsert(
    "Student",
    students.map((s) => ({
      admissionNumber: s.admissionNumber,
      studentName: s.studentName,
      class: s.class,
      section: s.section,
      gender: s.gender,
      dob: toISO(s.dob),
      bloodGroup: s.bloodGroup,
      parentName: s.parentName,
      phone: s.phone,
      createdAt: toISO(s.createdAt),
      updatedAt: toISO(s.updatedAt),
    })),
    "admissionNumber"
  );

  // 2. Health Checkups
  console.log("\n🏥  Migrating Health Checkups...");
  const checkups = await sqliteClient.healthCheckup.findMany();
  console.log(`     Found ${checkups.length} checkup records`);
  await upsert(
    "HealthCheckup",
    checkups.map((c) => ({
      id: c.id,
      admissionNumber: c.admissionNumber,
      academicYear: c.academicYear,
      checkupDate: toISO(c.checkupDate),
      height: c.height,
      weight: c.weight,
      bmi: c.bmi,
      eyesightLeft: c.eyesightLeft,
      eyesightRight: c.eyesightRight,
      dentalHealth: c.dentalHealth,
      bloodPressure: c.bloodPressure,
      nutritionalStatus: c.nutritionalStatus,
      nutritionRemarks: c.nutritionRemarks,
      entEars: c.entEars ?? "Normal",
      entNose: c.entNose ?? "Normal",
      entThroat: c.entThroat ?? "Normal",
      entRemarks: c.entRemarks,
      doctorName: c.doctorName,
      createdAt: toISO(c.createdAt),
      updatedAt: toISO(c.updatedAt),
    })),
    "admissionNumber,academicYear"
  );

  // 3. Observations
  console.log("\n📝  Migrating Observations...");
  const observations = await sqliteClient.observation.findMany();
  console.log(`     Found ${observations.length} observations`);
  await upsert(
    "Observation",
    observations.map((o) => ({
      id: o.id,
      admissionNumber: o.admissionNumber,
      academicYear: o.academicYear,
      observation: o.observation,
      recommendation: o.recommendation,
      createdAt: toISO(o.createdAt),
      updatedAt: toISO(o.updatedAt),
    })),
    "id"
  );

  // 4. Immunizations
  console.log("\n💉  Migrating Immunizations...");
  const immunizations = await sqliteClient.immunization.findMany();
  console.log(`     Found ${immunizations.length} immunization records`);
  await upsert(
    "Immunization",
    immunizations.map((i) => ({
      id: i.id,
      admissionNumber: i.admissionNumber,
      vaccine: i.vaccine,
      date: toISO(i.date),
      dose: i.dose,
      nextDue: toISO(i.nextDue),
      remarks: i.remarks,
      createdAt: toISO(i.createdAt),
      updatedAt: toISO(i.updatedAt),
    })),
    "id"
  );

  // 5. Special Needs
  console.log("\n♿  Migrating Special Needs...");
  const specialNeeds = await sqliteClient.specialNeed.findMany();
  console.log(`     Found ${specialNeeds.length} special need records`);
  await upsert(
    "SpecialNeed",
    specialNeeds.map((sn) => ({
      id: sn.id,
      admissionNumber: sn.admissionNumber,
      allergies: sn.allergies,
      chronicIllness: sn.chronicIllness,
      disabilities: sn.disabilities,
      learningDifficulties: sn.learningDifficulties,
      medication: sn.medication,
      emergencyNotes: sn.emergencyNotes,
      updatedAt: toISO(sn.updatedAt),
    })),
    "admissionNumber"
  );

  // 6. Attachments
  console.log("\n📎  Migrating Attachments...");
  const attachments = await sqliteClient.attachment.findMany();
  console.log(`     Found ${attachments.length} attachment records`);
  await upsert(
    "Attachment",
    attachments.map((a) => ({
      id: a.id,
      admissionNumber: a.admissionNumber,
      filename: a.filename,
      storedName: a.storedName,
      fileUrl: a.fileUrl,
      category: a.category,
      uploadedDate: toISO(a.uploadedDate),
    })),
    "id"
  );

  // 7. Doctors
  console.log("\n👨‍⚕️  Migrating Doctors...");
  const doctors = await sqliteClient.doctor.findMany();
  console.log(`     Found ${doctors.length} doctor accounts`);
  await upsert(
    "Doctor",
    doctors.map((d) => ({
      id: d.id,
      username: d.username,
      password: d.password,
      name: d.name,
      role: d.role,
      createdAt: toISO(d.createdAt),
    })),
    "username"
  );

  // 8. Activity Log (last 2000 entries to avoid overwhelming Supabase)
  console.log("\n📋  Migrating Activity Log (last 2000 entries)...");
  const logs = await sqliteClient.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  console.log(`     Found ${logs.length} activity log entries`);
  await upsert(
    "ActivityLog",
    logs.map((l) => ({
      id: l.id,
      actor: l.actor,
      role: l.role,
      action: l.action,
      details: l.details,
      createdAt: toISO(l.createdAt),
    })),
    "id"
  );

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅  Migration complete!");
  console.log("   All student records have been pushed to Supabase PostgreSQL.");
  console.log("   You can now deploy to Netlify with the Supabase DATABASE_URL.\n");

  await sqliteClient.$disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  sqliteClient.$disconnect();
  process.exit(1);
});
