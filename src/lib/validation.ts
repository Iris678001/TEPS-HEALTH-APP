import { z } from "zod";
import { PARENT_CHRONIC_CONDITIONS } from "@/lib/constants";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)")
  .refine((val) => {
    const d = new Date(`${val}T00:00:00.000Z`);
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
  }, "Must be a valid calendar date (YYYY-MM-DD)");

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
  aadhaarNumber: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  identificationMarks: z.string().trim().max(300).optional().nullable(),
  emergencyContact: z.string().trim().max(50).optional().nullable(),
});

export const studentUpdateSchema = studentSchema.omit({ admissionNumber: true });

// ─── Health checkups ─────────────────────────────────────────────────────────
export const checkupSchema = z.object({
  admissionNumber,
  academicYear,
  checkupDate: isoDate,
  height: z.coerce.number().min(0, "Height must be 0-250 cm").max(250).default(0),
  weight: z.coerce.number().min(0, "Weight must be 0-200 kg").max(200).default(0),
  eyesightLeft: z.string().trim().max(30).default("Pending"),
  eyesightRight: z.string().trim().max(30).default("Pending"),
  dentalHealth: z.string().trim().max(50).default("Pending"),
  bloodPressure: z.string().trim().max(30).default("Pending"),
  nutritionalStatus: z
    .enum(["Normal", "Underweight", "Overweight", "Obese", "Malnourished"])
    .default("Normal"),
  nutritionRemarks: z.string().trim().max(500).optional().nullable(),
  entEars: z.string().trim().max(100).optional().nullable(),
  entNose: z.string().trim().max(100).optional().nullable(),
  entThroat: z.string().trim().max(100).optional().nullable(),
  entRemarks: z.string().trim().max(500).optional().nullable(),
  doctorName: z.string().trim().min(2, "Doctor name is required").max(100),
  station: z.enum(["general", "dental", "eye"]).optional(),
});

export const checkupUpdateSchema = z.object({
  academicYear: academicYear.optional(),
  checkupDate: isoDate.optional(),
  height: z.coerce.number().min(0, "Height must be 0-250 cm").max(250).optional(),
  weight: z.coerce.number().min(0, "Weight must be 0-200 kg").max(200).optional(),
  eyesightLeft: z.string().trim().max(30).optional(),
  eyesightRight: z.string().trim().max(30).optional(),
  dentalHealth: z.string().trim().max(50).optional(),
  bloodPressure: z.string().trim().max(30).optional(),
  nutritionalStatus: z
    .enum(["Normal", "Underweight", "Overweight", "Obese", "Malnourished"])
    .optional(),
  nutritionRemarks: z.string().trim().max(500).optional().nullable(),
  entEars: z.string().trim().max(100).optional().nullable(),
  entNose: z.string().trim().max(100).optional().nullable(),
  entThroat: z.string().trim().max(100).optional().nullable(),
  entRemarks: z.string().trim().max(500).optional().nullable(),
  doctorName: z.string().trim().min(2, "Doctor name is required").max(100).optional(),
  station: z.enum(["general", "dental", "eye"]).optional(),
});

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
    .union([isoDate, z.literal(""), z.null()])
    .optional()
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

export const parentVaccineItemSchema = z.object({
  vaccine: z.string().trim().min(2, "Vaccine name is required").max(80),
  dose: z.string().trim().min(1).max(40).default("Completed Primary"),
  date: z
    .union([isoDate, z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? (v as string) : null)),
  remarks: z.string().trim().max(300).optional().nullable(),
});

export const parentVaccinesSchema = z.object({
  admissionNumber,
  token: z.string().min(10, "Parent session token is required"),
  vaccines: z.array(parentVaccineItemSchema).min(1, "Please select at least one vaccine"),
});

export const parentBloodGroupSchema = z.object({
  admissionNumber,
  token: z.string().min(10, "Parent session token is required"),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "N/A"]),
});

export const parentConditionsSchema = z.object({
  admissionNumber,
  token: z.string().min(10, "Parent session token is required"),
  conditions: z.array(z.string().trim()).default([]),
  additionalNotes: z.string().trim().max(1000).optional().nullable(),
});

export const parentCardDetailsSchema = z.object({
  admissionNumber,
  token: z.string().min(10, "Parent session token is required"),
  aadhaarNumber: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  parentName: z.string().trim().min(2, "Parent / Guardian name is required").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,17}$/, "Enter a valid contact number"),
  emergencyContact: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  address: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  identificationMarks: z
    .string()
    .trim()
    .max(300)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function firstErrorMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid input.";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
