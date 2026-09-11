/**
 * SHRMS database seed — realistic sample data.
 *
 * Run:  cd /home/z/my-project && bun prisma/seed.ts
 *
 * Idempotent: wipes every table in FK-safe order, then re-inserts.
 * Does NOT touch prisma/schema.prisma or anything under src/.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Fallback only — bun auto-loads .env which already defines DATABASE_URL.
process.env.DATABASE_URL ??= "file:/home/z/my-project/db/custom.db";

const prisma = new PrismaClient();

// ─── helpers ─────────────────────────────────────────────────────────────────
const UTC = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const pad = (n: number) => String(n).padStart(2, "0");
const round1 = (x: number) => Math.round(x * 10) / 10;
const bmiOf = (weightKg: number, heightCm: number) =>
  round1(weightKg / Math.pow(heightCm / 100, 2));

// Academic years seeded (April → March cycles). Index 0/1/2 → AY start year 2023/2024/2025.
const YEARS = ["2023-2024", "2024-2025", "2025-2026"];

// ─── doctors ─────────────────────────────────────────────────────────────────
const doctors = [
  { username: "admin", password: "admin123", name: "Dr. Admin", role: "admin" },
  { username: "drmehta", password: "doctor123", name: "Dr. Anita Mehta", role: "doctor" },
];

// ─── students ────────────────────────────────────────────────────────────────
// height0/weight0 = AY 2023-2024 baseline; dH/dW = yearly growth (cm / kg).
// eyes  = [left, right] per academic year slot; dental = one entry per year slot.
type SeedStudent = {
  admissionNumber: string;
  studentName: string;
  class: string;
  section: string;
  gender: string;
  dob: Date;
  bloodGroup: string;
  parentName: string;
  phone: string;
  height0: number;
  weight0: number;
  dH: number;
  dW: number;
  sys: number;
  dia: number;
  nutritionalStatus: string;
  nutritionRemarks: string | null;
  eyes: [string, string][];
  dental: string[];
  hasAY2025: boolean; // gets a 2025-2026 checkup? (5 students stay pending)
  immunizationExtras: string[]; // extra vaccines beyond the base 3
};

const students: SeedStudent[] = [
  {
    admissionNumber: "ADM001", studentName: "Aarav Sharma", class: "VI", section: "A",
    gender: "Male", dob: UTC("2013-05-14"), bloodGroup: "O+", parentName: "Rajesh Sharma",
    phone: "+91 98765 43210",
    height0: 141, weight0: 33, dH: 5, dW: 2.25, sys: 104, dia: 66,
    nutritionalStatus: "Normal", nutritionRemarks: null,
    eyes: [["6/6", "6/6"], ["6/6", "6/6"], ["6/6", "6/6"]],
    dental: ["Healthy", "Healthy", "Healthy"],
    hasAY2025: true, immunizationExtras: ["polio", "typhoid"],
  },
  {
    admissionNumber: "ADM002", studentName: "Ananya Iyer", class: "VI", section: "B",
    gender: "Female", dob: UTC("2013-09-08"), bloodGroup: "A+", parentName: "Sunita Iyer",
    phone: "+91 98111 22334",
    height0: 139, weight0: 31, dH: 5.5, dW: 2.5, sys: 102, dia: 64,
    nutritionalStatus: "Normal", nutritionRemarks: null,
    eyes: [["6/6", "6/6"], ["6/6", "6/6"], ["6/6", "6/6"]],
    dental: ["Cavities", "Healthy", "Healthy"],
    hasAY2025: true, immunizationExtras: ["polio", "tdap"],
  },
  {
    admissionNumber: "ADM003", studentName: "Vihaan Patel", class: "VI", section: "A",
    gender: "Male", dob: UTC("2013-11-02"), bloodGroup: "B+", parentName: "Kiran Patel",
    phone: "+91 98220 31415",
    height0: 138, weight0: 27, dH: 5, dW: 2, sys: 104, dia: 66,
    nutritionalStatus: "Underweight",
    nutritionRemarks: "BMI below expected range for age; high-protein diet and weekly weight tracking advised",
    eyes: [["6/6", "6/6"], ["6/6", "6/6"], ["6/6", "6/6"]],
    dental: ["Healthy", "Healthy", "Healthy"],
    hasAY2025: true, immunizationExtras: ["chickenpox"],
  },
  {
    admissionNumber: "ADM004", studentName: "Diya Reddy", class: "VII", section: "A",
    gender: "Female", dob: UTC("2012-07-19"), bloodGroup: "AB+", parentName: "Srinivas Reddy",
    phone: "+91 98334 45667",
    height0: 148, weight0: 37, dH: 4.5, dW: 3, sys: 106, dia: 68,
    nutritionalStatus: "Normal", nutritionRemarks: null,
    eyes: [["6/6", "6/6"], ["6/6", "6/6"], ["6/6", "6/9"]],
    dental: ["Healthy", "Healthy", "Healthy"],
    hasAY2025: false, immunizationExtras: ["polio", "tdap"],
  },
  {
    admissionNumber: "ADM005", studentName: "Arjun Nair", class: "VII", section: "B",
    gender: "Male", dob: UTC("2012-04-03"), bloodGroup: "O-", parentName: "Meera Nair",
    phone: "+91 98445 56778",
    height0: 147, weight0: 36, dH: 5, dW: 3, sys: 108, dia: 70,
    nutritionalStatus: "Normal", nutritionRemarks: null,
    eyes: [["6/9", "6/9"], ["6/9", "6/9"], ["6/9", "6/9"]],
    dental: ["Healthy", "Healthy", "Healthy"],
    hasAY2025: true, immunizationExtras: ["typhoid", "chickenpox"],
  },
  {
    admissionNumber: "ADM006", studentName: "Saanvi Gupta", class: "VII", section: "A",
    gender: "Female", dob: UTC("2012-10-30"), bloodGroup: "A-", parentName: "Pankaj Gupta",
    phone: "+91 98556 67889",
    height0: 145, weight0: 28.5, dH: 5.5, dW: 2, sys: 104, dia: 66,
    nutritionalStatus: "Underweight",
    nutritionRemarks: "Borderline underweight; iron-rich diet and a midday fruit break advised",
    eyes: [["6/6", "6/6"], ["6/6", "6/6"], ["6/6", "6/6"]],
    dental: ["Healthy", "Healthy", "Healthy"],
    hasAY2025: false, immunizationExtras: ["tdap"],
  },
  {
    admissionNumber: "ADM007", studentName: "Kabir Singh", class: "VIII", section: "B",
    gender: "Male", dob: UTC("2011-06-21"), bloodGroup: "B-", parentName: "Harpreet Singh",
    phone: "+91 98667 78990",
    height0: 150, weight0: 52, dH: 5, dW: 4, sys: 112, dia: 72,
    nutritionalStatus: "Obese",
    nutritionRemarks: "BMI above healthy range for age; referred to nutritionist, 45 minutes of daily activity advised",
    eyes: [["6/6", "6/6"], ["6/6", "6/6"], ["6/6", "6/6"]],
    dental: ["Healthy", "Healthy", "Healthy"],
    hasAY2025: true, immunizationExtras: ["polio", "typhoid"],
  },
  {
    admissionNumber: "ADM008", studentName: "Isha Chatterjee", class: "VIII", section: "A",
    gender: "Female", dob: UTC("2011-12-05"), bloodGroup: "O+", parentName: "Debjani Chatterjee",
    phone: "+91 98778 89001",
    height0: 154, weight0: 43, dH: 5, dW: 3, sys: 108, dia: 70,
    nutritionalStatus: "Normal", nutritionRemarks: null,
    eyes: [["6/12", "6/9"], ["6/9", "6/9"], ["6/9", "6/9"]],
    dental: ["Healthy", "Healthy", "Healthy"],
    hasAY2025: false, immunizationExtras: ["chickenpox", "tdap"],
  },
  {
    admissionNumber: "ADM009", studentName: "Aditya Verma", class: "VIII", section: "A",
    gender: "Male", dob: UTC("2010-09-14"), bloodGroup: "A+", parentName: "Sanjay Verma",
    phone: "+91 98889 90112",
    height0: 156, weight0: 42, dH: 5.5, dW: 3, sys: 110, dia: 70,
    nutritionalStatus: "Normal", nutritionRemarks: null,
    eyes: [["6/6", "6/6"], ["6/6", "6/6"], ["6/6", "6/6"]],
    dental: ["Healthy", "Minor Issues", "Healthy"],
    hasAY2025: true, immunizationExtras: ["polio", "chickenpox"],
  },
  {
    admissionNumber: "ADM010", studentName: "Myra Kapoor", class: "IX", section: "B",
    gender: "Female", dob: UTC("2010-05-27"), bloodGroup: "AB-", parentName: "Rohit Kapoor",
    phone: "+91 98990 01223",
    height0: 153, weight0: 47, dH: 5, dW: 3, sys: 110, dia: 72,
    nutritionalStatus: "Overweight",
    nutritionRemarks: "Trending overweight; replace sugary drinks with water and monitor BMI quarterly",
    eyes: [["6/6", "6/6"], ["6/6", "6/6"], ["6/6", "6/6"]],
    dental: ["Healthy", "Healthy", "Healthy"],
    hasAY2025: false, immunizationExtras: ["typhoid"],
  },
  {
    admissionNumber: "ADM011", studentName: "Rehan Khan", class: "IX", section: "A",
    gender: "Male", dob: UTC("2010-03-15"), bloodGroup: "B+", parentName: "Imran Khan",
    phone: "+91 99110 12334",
    height0: 161, weight0: 45, dH: 5, dW: 3.5, sys: 112, dia: 72,
    nutritionalStatus: "Normal", nutritionRemarks: null,
    eyes: [["6/6", "6/6"], ["6/6", "6/6"], ["6/6", "6/6"]],
    dental: ["Healthy", "Healthy", "Cavities"],
    hasAY2025: true, immunizationExtras: ["polio", "typhoid"],
  },
  {
    admissionNumber: "ADM012", studentName: "Pooja Hegde", class: "X", section: "A",
    gender: "Female", dob: UTC("2008-11-08"), bloodGroup: "O+", parentName: "Ramesh Hegde",
    phone: "+91 99220 23445",
    height0: 155, weight0: 32, dH: 4, dW: 1.5, sys: 114, dia: 74,
    nutritionalStatus: "Malnourished",
    nutritionRemarks: "Signs of malnourishment; anaemia screening done, fortified diet and daily multivitamin advised",
    eyes: [["6/6", "6/6"], ["6/6", "6/6"], ["6/6", "6/6"]],
    dental: ["Healthy", "Healthy", "Healthy"],
    hasAY2025: false, immunizationExtras: ["chickenpox"],
  },
];

// ─── observations ────────────────────────────────────────────────────────────
const observations = [
  {
    admissionNumber: "ADM001", academicYear: "2024-2025",
    observation: "Recurrent cough during winter months, disturbed sleep reported by parents",
    recommendation: "Refer to paediatrician; repeat pulmonary check after 6 months",
  },
  {
    admissionNumber: "ADM003", academicYear: "2023-2024",
    observation: "Underweight; BMI below expected range for age at annual checkup",
    recommendation: "High-protein diet plan shared with parents; review weight gain after 3 months",
  },
  {
    admissionNumber: "ADM003", academicYear: "2024-2025",
    observation: "Complains of fatigue during physical education classes",
    recommendation: "Advise haemoglobin test; begin iron supplementation pending blood report",
  },
  {
    admissionNumber: "ADM007", academicYear: "2024-2025",
    observation: "Obesity; BMI well above healthy range for age and rising year over year",
    recommendation: "Refer to nutritionist; 45 minutes of daily physical activity and reduced sugary snacks",
  },
  {
    admissionNumber: "ADM008", academicYear: "2023-2024",
    observation: "Squints while reading and holds books very close to the eyes",
    recommendation: "Refer to ophthalmologist for vision testing; front-row seating advised",
  },
  {
    admissionNumber: "ADM008", academicYear: "2024-2025",
    observation: "Vision corrected with new spectacles; occasional headaches in bright light",
    recommendation: "Annual eye review; ensure glasses are worn during all classes",
  },
  {
    admissionNumber: "ADM010", academicYear: "2024-2025",
    observation: "Overweight trend; BMI approaching the 85th percentile for age",
    recommendation: "Structured diet plan issued; 30 minutes of daily exercise and quarterly BMI monitoring",
  },
  {
    admissionNumber: "ADM011", academicYear: "2023-2024",
    observation: "Frequent nosebleeds during dry summer months, 3-4 episodes per week",
    recommendation: "Saline nasal spray and humidifier at home advised; refer to ENT if episodes continue",
  },
];

// ─── special needs (1:1) ─────────────────────────────────────────────────────
const specialNeeds = [
  {
    admissionNumber: "ADM001",
    allergies: "Penicillin allergy; peanut allergy (severe)",
    chronicIllness: null, disabilities: null, learningDifficulties: null,
    medication: "Adrenaline auto-injector (EpiPen) kept in school infirmary",
    emergencyNotes:
      "On accidental peanut exposure: administer EpiPen immediately, inform parents and call emergency services",
  },
  {
    admissionNumber: "ADM005",
    allergies: null,
    chronicIllness: "Mild asthma; uses inhaler during sports",
    disabilities: null, learningDifficulties: null,
    medication: "Salbutamol inhaler, 2 puffs before sports period",
    emergencyNotes:
      "On wheezing: keep student upright, use inhaler, escalate to infirmary if no relief within 10 minutes",
  },
  {
    admissionNumber: "ADM008",
    allergies: null, chronicIllness: null, disabilities: null,
    learningDifficulties: "Mild dyslexia; needs extra time in exams",
    medication: null,
    emergencyNotes: "Front-row seating; worksheets printed in dyslexia-friendly font",
  },
  {
    admissionNumber: "ADM011",
    allergies: null,
    chronicIllness: "Mild epilepsy; absence seizures, controlled on medication",
    disabilities: null, learningDifficulties: null,
    medication: "Levetiracetam 250 mg twice daily",
    emergencyNotes:
      "During a seizure: lay student on side, clear surroundings, do not restrain; inform parents immediately",
  },
];

// ─── immunizations ───────────────────────────────────────────────────────────
type ImmRow = {
  admissionNumber: string;
  vaccine: string;
  date: Date;
  dose: string;
  nextDue: Date | null;
  remarks: string | null;
};

function immunizationsFor(s: SeedStudent): ImmRow[] {
  const y = s.dob.getUTCFullYear(); // plausible childhood schedule anchored to birth year
  const rows: Omit<ImmRow, "admissionNumber">[] = [
    {
      vaccine: "Hepatitis B", dose: "2nd Dose", date: UTC(`${y + 5}-06-15`),
      nextDue: null, remarks: "Full course completed at municipal clinic",
    },
    {
      vaccine: "MMR", dose: "2nd Dose", date: UTC(`${y + 5}-11-20`),
      nextDue: null, remarks: null,
    },
    {
      vaccine: "DPT Booster", dose: "Booster", date: UTC(`${y + 7}-03-10`),
      nextDue: null, remarks: "No adverse reaction reported",
    },
  ];

  for (const tag of s.immunizationExtras) {
    if (tag === "polio") {
      rows.push({
        vaccine: "Polio", dose: "Booster", date: UTC(`${y + 4}-01-24`),
        nextDue: null, remarks: "OPV course completed",
      });
    } else if (tag === "typhoid") {
      rows.push({
        vaccine: "Typhoid", dose: "1st Dose", date: UTC(`${y + 8}-08-02`),
        nextDue: null, remarks: null,
      });
      rows.push({
        vaccine: "Typhoid", dose: "Booster", date: UTC("2022-08-06"),
        nextDue: UTC("2027-08-06"), remarks: "Booster given at school medical camp",
      });
    } else if (tag === "tdap") {
      rows.push({
        vaccine: "Tdap", dose: "Booster", date: UTC("2022-09-14"),
        nextDue: UTC("2032-09-14"), remarks: "Tetanus protection valid for 10 years",
      });
    } else if (tag === "chickenpox") {
      rows.push({
        vaccine: "Chickenpox", dose: "2nd Dose", date: UTC(`${y + 6}-02-11`),
        nextDue: null, remarks: "No varicella infection since",
      });
    }
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows.map((r) => ({ ...r, admissionNumber: s.admissionNumber }));
}

// ─── activity logs (staggered over the last few days) ────────────────────────
const hoursAgo = [72, 68, 50, 46, 30, 26, 10, 5];
const activityLogs = [
  { actor: "drmehta", role: "doctor", action: "Created health checkup", details: "ADM001 · AY 2025-2026" },
  { actor: "drmehta", role: "doctor", action: "Created health checkup", details: "ADM002 · AY 2025-2026" },
  { actor: "admin", role: "doctor", action: "Created health checkup", details: "ADM005 · AY 2025-2026" },
  { actor: "drmehta", role: "doctor", action: "Added observation", details: "ADM007 · AY 2024-2025" },
  { actor: "admin", role: "doctor", action: "Updated health checkup", details: "ADM010 · AY 2024-2025" },
  { actor: "drmehta", role: "doctor", action: "Added immunization record", details: "ADM003 · Typhoid Booster" },
  { actor: "admin", role: "doctor", action: "Updated special needs", details: "ADM005 · Asthma medication updated" },
  { actor: "admin", role: "doctor", action: "Generated student report", details: "ADM001 · Annual summary" },
].map((entry, i) => ({
  ...entry,
  createdAt: new Date(Date.now() - hoursAgo[i] * 60 * 60 * 1000),
}));

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Wipe existing rows — FK-safe order (children first).
  console.log("Clearing existing rows (FK-safe order)…");
  await prisma.activityLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.specialNeed.deleteMany();
  await prisma.immunization.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.healthCheckup.deleteMany();
  await prisma.student.deleteMany();
  await prisma.doctor.deleteMany();

  // 2. Doctor accounts (bcrypt, 10 rounds).
  const doctorRows = await Promise.all(
    doctors.map(async (d) => ({ ...d, password: await bcrypt.hash(d.password, 10) })),
  );
  await prisma.doctor.createMany({ data: doctorRows });
  console.log(`✓ Doctors: ${doctorRows.length}`);

  // 3. Students.
  await prisma.student.createMany({
    data: students.map((s) => ({
      admissionNumber: s.admissionNumber,
      studentName: s.studentName,
      class: s.class,
      section: s.section,
      gender: s.gender,
      dob: s.dob,
      bloodGroup: s.bloodGroup,
      parentName: s.parentName,
      phone: s.phone,
    })),
  });
  console.log(`✓ Students: ${students.length}`);

  // 4. Annual health checkups — AY 2023-2024 & 2024-2025 for all, 2025-2026 for ~7 of 12.
  const checkupRows = [];
  students.forEach((s, idx) => {
    const month = 7 + (idx % 3); // Jul / Aug / Sep of the AY start year
    const day = 8 + ((idx * 3) % 18); // spread across the month
    YEARS.forEach((ay, yIdx) => {
      if (ay === "2025-2026" && !s.hasAY2025) return; // leave pending for dashboard
      const height = round1(s.height0 + s.dH * yIdx);
      const weight = round1(s.weight0 + s.dW * yIdx);
      checkupRows.push({
        admissionNumber: s.admissionNumber,
        academicYear: ay,
        checkupDate: UTC(`${2023 + yIdx}-${pad(month)}-${pad(day)}`),
        height,
        weight,
        bmi: bmiOf(weight, height),
        eyesightLeft: s.eyes[yIdx][0],
        eyesightRight: s.eyes[yIdx][1],
        dentalHealth: s.dental[yIdx],
        bloodPressure: `${s.sys + yIdx * 2}/${s.dia + yIdx * 2}`,
        nutritionalStatus: s.nutritionalStatus,
        nutritionRemarks: s.nutritionRemarks,
        doctorName: idx % 2 === 0 ? "Dr. Anita Mehta" : "Dr. Admin",
      });
    });
  });
  await prisma.healthCheckup.createMany({ data: checkupRows });
  console.log(`✓ Health checkups: ${checkupRows.length}`);

  // 5. Observations.
  await prisma.observation.createMany({ data: observations });
  console.log(`✓ Observations: ${observations.length}`);

  // 6. Immunizations (3-6 per student).
  const immRows = students.flatMap(immunizationsFor);
  await prisma.immunization.createMany({ data: immRows });
  console.log(`✓ Immunizations: ${immRows.length}`);

  // 7. Special needs (1:1).
  await prisma.specialNeed.createMany({ data: specialNeeds });
  console.log(`✓ Special needs: ${specialNeeds.length}`);

  // 8. Activity logs.
  await prisma.activityLog.createMany({ data: activityLogs });
  console.log(`✓ Activity logs: ${activityLogs.length}`);

  // 9. Summary — verify counts by querying back.
  const counts = {
    doctors: await prisma.doctor.count(),
    students: await prisma.student.count(),
    checkups: await prisma.healthCheckup.count(),
    observations: await prisma.observation.count(),
    immunizations: await prisma.immunization.count(),
    specialNeeds: await prisma.specialNeed.count(),
    attachments: await prisma.attachment.count(),
    activityLogs: await prisma.activityLog.count(),
  };
  const pendingAY2025 = await prisma.student.count({
    where: { checkups: { none: { academicYear: "2025-2026" } } },
  });
  const perYear = await prisma.healthCheckup.groupBy({
    by: ["academicYear"],
    _count: { _all: true },
    orderBy: { academicYear: "asc" },
  });

  console.log("\n──────── Seed summary ────────");
  for (const [k, v] of Object.entries(counts)) console.log(`${k.padEnd(14)}: ${v}`);
  console.log("checkups by year:");
  for (const row of perYear)
    console.log(`  ${row.academicYear}: ${row._count._all}`);
  console.log(`\nStudents pending AY 2025-2026 checkup: ${pendingAY2025}`);
  console.log("Seed completed successfully. ✓");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
