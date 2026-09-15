/**
 * SHRMS Database Seed — The Elegant Public School Production Dataset
 *
 * Populates:
 * - 4 Staff/Doctor accounts (admin, drmehta, drsharma, nursepriya)
 * - 688 Real Students imported from The Elegant Public School records
 * - 0 Medical records (all checkups, observations, immunizations, special needs, attachments left blank for new entries)
 *
 * Run: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set.");
}

const prisma = new PrismaClient();

const doctors = [
  { username: "admin", password: "admin123", name: "Dr. Admin", role: "admin" },
  { username: "drmehta", password: "doctor123", name: "Dr. Anita Mehta", role: "doctor_general" },
  { username: "drsharma", password: "doctor123", name: "Dr. Rajesh Sharma", role: "doctor_general" },
  { username: "drdental", password: "doctor123", name: "Dr. Vikram Seth (Dental)", role: "doctor_dental" },
  { username: "dreye", password: "doctor123", name: "Dr. Sunita Rao (Ophthalmology)", role: "doctor_eye" },
  { username: "nursepriya", password: "nurse123", name: "Nurse Priya Sen", role: "nurse" },
];

interface StudentRecord {
  admissionNumber: string;
  studentName: string;
  class: string;
  section: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  parentName: string;
  phone: string;
}

async function main() {
  console.log("Starting SHRMS database seed for The Elegant Public School...\n");

  // 1. Seed Doctor/Staff Accounts
  console.log("Seeding staff accounts...");
  for (const doc of doctors) {
    const hashedPassword = await bcrypt.hash(doc.password, 10);
    await prisma.doctor.upsert({
      where: { username: doc.username },
      update: {
        name: doc.name,
        role: doc.role,
        password: hashedPassword,
      },
      create: {
        username: doc.username,
        password: hashedPassword,
        name: doc.name,
        role: doc.role,
      },
    });
  }
  console.log(`✓ Seeded ${doctors.length} staff accounts.\n`);

  // 2. Clear all medical records (leave blank for fresh examination entries)
  console.log("Clearing existing medical examination records...");
  await prisma.attachment.deleteMany();
  await prisma.specialNeed.deleteMany();
  await prisma.immunization.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.healthCheckup.deleteMany();
  console.log("✓ All medical records cleared (ready for new entries).\n");

  // 3. Load and Seed Real Students
  const jsonPath = path.join(__dirname, "students.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`students.json not found at ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const studentList: StudentRecord[] = JSON.parse(rawData);

  console.log(`Seeding ${studentList.length} real students from The Elegant Public School...`);

  // Clean up any students that are not in the new dataset
  const validAdmissions = studentList.map((s) => s.admissionNumber);
  await prisma.student.deleteMany({
    where: {
      admissionNumber: { notIn: validAdmissions },
    },
  });

  // Upsert all students in batches
  const batchSize = 100;
  for (let i = 0; i < studentList.length; i += batchSize) {
    const batch = studentList.slice(i, i + batchSize);
    await Promise.all(
      batch.map((s) =>
        prisma.student.upsert({
          where: { admissionNumber: s.admissionNumber },
          update: {
            studentName: s.studentName,
            class: s.class,
            section: s.section,
            gender: s.gender,
            dob: new Date(s.dob),
            bloodGroup: s.bloodGroup || "N/A",
            parentName: s.parentName,
            phone: s.phone,
          },
          create: {
            admissionNumber: s.admissionNumber,
            studentName: s.studentName,
            class: s.class,
            section: s.section,
            gender: s.gender,
            dob: new Date(s.dob),
            bloodGroup: s.bloodGroup || "N/A",
            parentName: s.parentName,
            phone: s.phone,
          },
        })
      )
    );
  }

  console.log(`✓ Successfully seeded ${studentList.length} students.\n`);

  // 4. Verification Summary
  const counts = {
    doctors: await prisma.doctor.count(),
    students: await prisma.student.count(),
    checkups: await prisma.healthCheckup.count(),
    observations: await prisma.observation.count(),
    immunizations: await prisma.immunization.count(),
    specialNeeds: await prisma.specialNeed.count(),
    attachments: await prisma.attachment.count(),
  };

  console.log("================ DATABASE SEED SUMMARY ================");
  for (const [key, val] of Object.entries(counts)) {
    console.log(`${key.padEnd(16)}: ${val}`);
  }
  console.log("=======================================================\n");
  console.log("All student records ready for nurse and doctor data entry! ✓");
}

main()
  .catch((e) => {
    console.error("Failed to seed database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
