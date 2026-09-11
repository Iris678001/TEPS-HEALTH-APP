// One-off utility: backfill current academic year checkups for a subset of students
// so the dashboard "coverage" chart reflects an in-progress checkup cycle.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const AY = "2026-2027";
const TARGETS = ["ADM001", "ADM002", "ADM003", "ADM005", "ADM007", "ADM009", "ADM011"];

async function main() {
  for (const adm of TARGETS) {
    const latest = await db.healthCheckup.findFirst({
      where: { admissionNumber: adm },
      orderBy: { checkupDate: "desc" },
    });
    if (!latest) continue;

    const height = Math.round((latest.height + 4 + Math.random() * 3) * 10) / 10;
    const weight = Math.round((latest.weight + 2 + Math.random() * 1.5) * 10) / 10;
    const m = height / 100;
    const bmi = Math.round((weight / (m * m)) * 10) / 10;

    await db.healthCheckup.upsert({
      where: {
        admissionNumber_academicYear: { admissionNumber: adm, academicYear: AY },
      },
      create: {
        admissionNumber: adm,
        academicYear: AY,
        checkupDate: new Date("2026-08-15T00:00:00.000Z"),
        height,
        weight,
        bmi,
        eyesightLeft: latest.eyesightLeft,
        eyesightRight: latest.eyesightRight,
        dentalHealth: latest.dentalHealth,
        bloodPressure: latest.bloodPressure,
        nutritionalStatus: latest.nutritionalStatus,
        nutritionRemarks: latest.nutritionRemarks,
        doctorName: "Dr. Anita Mehta",
      },
      update: {},
    });
    console.log(`✓ ${adm} → AY ${AY} (BMI ${bmi})`);
  }
  console.log("Total checkups:", await db.healthCheckup.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
