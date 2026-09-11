import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)");

const academicYear = z
  .string()
  .regex(/^\d{4}-\d{4}$/, "Academic year must look like 2025-2026");

const admissionNumber = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{3,20}$/, "Admission number must be 3-20 letters, digits or dashes");

// ─── Auth ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  username: z.string().trim().min(2, "Username is required").max(50),
  password: z.string().min(4, "Password must be at least 4 characters").max(100),
});

// ─── Students ────────────────────────────────────────────────────────────────
export const studentSchema = z.object({
  admissionNumber,
  studentName: z.string().trim().min(2, "Student name is required").max(80),
  class: z.string().trim().min(1, "Class is required").max(10),
  section: z.string().trim().min(1, "Section is required").max(5),
  gender: z.enum(["Male", "Female", "Other"]),
  dob: isoDate,
  bloodGroup: z.string().trim().min(1, "Blood group is required").max(5),
  parentName: z.string().trim().min(2, "Parent name is required").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,17}$/, "Enter a valid contact number"),
});

export const studentUpdateSchema = studentSchema.omit({ admissionNumber: true });

// ─── Health checkups ─────────────────────────────────────────────────────────
export const checkupSchema = z.object({
  admissionNumber,
  academicYear,
  checkupDate: isoDate,
  height: z.coerce.number().min(50, "Height must be 50-250 cm").max(250),
  weight: z.coerce.number().min(2, "Weight must be 2-200 kg").max(200),
  eyesightLeft: z.string().trim().min(1, "Left eyesight is required").max(20),
  eyesightRight: z.string().trim().min(1, "Right eyesight is required").max(20),
  dentalHealth: z.string().trim().min(1, "Dental health is required").max(40),
  bloodPressure: z
    .string()
    .trim()
    .min(1, "Blood pressure is required")
    .max(20),
  nutritionalStatus: z.enum([
    "Normal",
    "Underweight",
    "Overweight",
    "Obese",
    "Malnourished",
  ]),
  nutritionRemarks: z.string().trim().max(500).optional().nullable(),
  doctorName: z.string().trim().min(2, "Doctor name is required").max(80),
});

export const checkupUpdateSchema = checkupSchema.omit({ admissionNumber: true });

// ─── Observations ────────────────────────────────────────────────────────────
export const observationSchema = z.object({
  admissionNumber,
  academicYear,
  observation: z.string().trim().min(3, "Observation is required").max(1000),
  recommendation: z.string().trim().min(3, "Recommendation is required").max(1000),
});

export const observationUpdateSchema = observationSchema.omit({ admissionNumber: true });

// ─── Immunizations ───────────────────────────────────────────────────────────
export const immunizationSchema = z.object({
  admissionNumber,
  vaccine: z.string().trim().min(2, "Vaccine name is required").max(60),
  date: isoDate,
  dose: z.string().trim().min(1, "Dose is required").max(40),
  nextDue: z
    .union([isoDate, z.literal(""), z.null(), z.undefined()])
    .transform((v) => (v ? (v as string) : null)),
  remarks: z.string().trim().max(300).optional().nullable(),
});

export const immunizationUpdateSchema = immunizationSchema.omit({ admissionNumber: true });

// ─── Special needs ───────────────────────────────────────────────────────────
export const specialNeedSchema = z.object({
  admissionNumber,
  allergies: z.string().trim().max(1000).optional().nullable(),
  chronicIllness: z.string().trim().max(1000).optional().nullable(),
  disabilities: z.string().trim().max(1000).optional().nullable(),
  learningDifficulties: z.string().trim().max(1000).optional().nullable(),
  medication: z.string().trim().max(1000).optional().nullable(),
  emergencyNotes: z.string().trim().max(1000).optional().nullable(),
});

// ─── Parent portal ───────────────────────────────────────────────────────────
export const parentVerifySchema = z.object({
  admissionNumber,
  dob: isoDate,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function firstErrorMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid input.";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
