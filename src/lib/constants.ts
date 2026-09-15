// ─── Domain constants & option lists ────────────────────────────────────────

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "N/A"] as const;

export const GENDERS = ["Male", "Female", "Other"] as const;

export const NUTRITIONAL_STATUS = [
  "Normal",
  "Underweight",
  "Overweight",
  "Obese",
  "Malnourished",
] as const;

export const DENTAL_HEALTH = [
  "Healthy",
  "Minor Issues",
  "Cavities",
  "Gum Disease",
  "Needs Attention",
] as const;

export const ENT_EARS_OPTIONS = [
  "Normal",
  "Wax Accumulation (Cerumen)",
  "Otitis Media / Ear Infection",
  "Hearing Impairment",
  "Ear Discharge",
  "Referred to ENT Specialist",
] as const;

export const ENT_NOSE_OPTIONS = [
  "Normal",
  "Deviated Nasal Septum (DNS)",
  "Allergic Rhinitis / Congestion",
  "Nasal Discharge / Sinusitis",
  "Nasal Polyp",
  "Referred to ENT Specialist",
] as const;

export const ENT_THROAT_OPTIONS = [
  "Normal",
  "Tonsillitis / Enlarged Tonsils",
  "Pharyngitis / Redness",
  "Hoarseness / Vocal Strain",
  "Adenoid Hypertrophy",
  "Referred to ENT Specialist",
] as const;

export const COMMON_VACCINES = [
  "BCG (Tuberculosis)",
  "Hepatitis B",
  "Polio (OPV / IPV)",
  "DTP / Pentavalent",
  "Rotavirus",
  "PCV (Pneumococcal)",
  "MMR (Measles, Mumps, Rubella)",
  "Typhoid (TCV)",
  "Hepatitis A",
  "Chickenpox (Varicella)",
  "DPT Booster",
  "Tdap / Td",
  "Annual Influenza",
  "HPV (Human Papillomavirus)",
  "Other",
] as const;

export const DOSE_OPTIONS = ["1st Dose", "2nd Dose", "3rd Dose", "Booster", "Annual"] as const;

export const ATTACHMENT_CATEGORIES = [
  "Medical Report",
  "Blood Test Report",
  "X-Ray",
  "Prescription",
  "Vaccination Certificate",
  "Other",
] as const;

export const CLASSES = [
  "KG 1",
  "KG 2",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

export const SECTIONS = ["A", "B", "C", "D"] as const;

export const NUTRITION_BADGE_VARIANT: Record<string, string> = {
  Normal: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Underweight: "bg-amber-100 text-amber-700 border-amber-200",
  Overweight: "bg-orange-100 text-orange-700 border-orange-200",
  Obese: "bg-red-100 text-red-700 border-red-200",
  Malnourished: "bg-purple-100 text-purple-700 border-purple-200",
};

export const MAX_UPLOAD_MB = 5;
export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export const APP_NAME = "The Elegant Public School — Health Record Management System";
export const APP_SHORT_NAME = "EPS Health";
export const SCHOOL_NAME = "The Elegant Public School";
export const SCHOOL_MOTTO = "EXPLORE • ENGROSS • EVOLVE";
export const CBSE_AFFILIATION = "Affiliated to CBSE: Affiliation No. 931265";
export const SCHOOL_LOGO = "/logo.png";
export const SCHOOL_ADDRESS = "Market Road, Palakkad, 678014";
export const SCHOOL_EMAIL = "theelegantpublicschoo@gmail.com";
export const SCHOOL_PHONE = "9995920120";

// ─── Staff & Doctor Specialty Roles ──────────────────────────────────────────

export const VALID_STAFF_ROLES = [
  "admin",
  "doctor_general",
  "doctor_dental",
  "doctor_eye",
  "nurse",
  "doctor", // legacy fallback for doctor_general
] as const;

export type StaffRole = (typeof VALID_STAFF_ROLES)[number];

export interface StaffRoleConfig {
  id: StaffRole;
  label: string;
  shortLabel: string;
  category: "admin" | "doctor" | "nurse";
  specialty?: "general" | "dental" | "eye";
  badgeClass: string;
  borderClass: string;
  bgLightClass: string;
  iconName: "Stethoscope" | "ShieldCheck" | "HeartHandshake" | "Smile" | "Eye";
  description: string;
}

export const STAFF_ROLE_CONFIGS: Record<StaffRole, StaffRoleConfig> = {
  admin: {
    id: "admin",
    label: "System Administrator",
    shortLabel: "Admin",
    category: "admin",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    borderClass: "border-amber-200",
    bgLightClass: "bg-amber-50/70",
    iconName: "ShieldCheck",
    description: "Full system administration with unrestricted access to all medical fields",
  },
  doctor_general: {
    id: "doctor_general",
    label: "General Doctor / Physician",
    shortLabel: "General Doctor",
    category: "doctor",
    specialty: "general",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    borderClass: "border-blue-200",
    bgLightClass: "bg-blue-50/70",
    iconName: "Stethoscope",
    description: "Evaluates vitals: height, weight, BMI, blood pressure, and nutritional health",
  },
  doctor_dental: {
    id: "doctor_dental",
    label: "Dental Doctor / Dentist",
    shortLabel: "Dental Doctor",
    category: "doctor",
    specialty: "dental",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-300",
    borderClass: "border-teal-200",
    bgLightClass: "bg-teal-50/70",
    iconName: "Smile",
    description: "Inspects oral hygiene, cavities, gum condition, and dental recommendations",
  },
  doctor_eye: {
    id: "doctor_eye",
    label: "Eye Doctor / Ophthalmologist",
    shortLabel: "Eye Doctor",
    category: "doctor",
    specialty: "eye",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    borderClass: "border-indigo-200",
    bgLightClass: "bg-indigo-50/70",
    iconName: "Eye",
    description: "Assesses visual acuity (Left & Right eye Snellen scale) and ophthalmic notes",
  },
  nurse: {
    id: "nurse",
    label: "School Nurse",
    shortLabel: "School Nurse",
    category: "nurse",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    borderClass: "border-emerald-200",
    bgLightClass: "bg-emerald-50/70",
    iconName: "HeartHandshake",
    description: "Assists with basic vitals screening, first aid, and immunizations",
  },
  doctor: {
    id: "doctor",
    label: "Medical Officer (General)",
    shortLabel: "General Doctor",
    category: "doctor",
    specialty: "general",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    borderClass: "border-blue-200",
    bgLightClass: "bg-blue-50/70",
    iconName: "Stethoscope",
    description: "Legacy general medical practitioner account with vitals screening access",
  },
};

export interface DoctorFieldPermissions {
  role: string;
  canEditVitals: boolean;       // height, weight, bloodPressure, nutritionalStatus, nutritionRemarks
  canEditEye: boolean;          // eyesightLeft, eyesightRight
  canEditDental: boolean;       // dentalHealth
  canEditEnt: boolean;          // entEars, entNose, entThroat, entRemarks (General Doctor & Admin)
  canEditObservations: boolean; // clinical observations & recommendations
  canEditImmunizations: boolean;// student immunization updates
}

export function getDoctorFieldPermissions(role?: string | null): DoctorFieldPermissions {
  const r = (role || "").trim().toLowerCase();
  // All clinical roles now have authorization to access, view, and document any checkup station
  return {
    role: r || "doctor_general",
    canEditVitals: true,
    canEditEye: true,
    canEditDental: true,
    canEditEnt: true,
    canEditObservations: true,
    canEditImmunizations: r === "admin" || r === "nurse",
  };
}

// ─── Parent Declared Chronic Health Conditions ──────────────────────────────

export const PARENT_CHRONIC_CONDITIONS = [
  "Mental Illness",
  "Epilepsy",
  "Depression",
  "Chronic Nephritis",
  "Uremia",
  "Infectious Disease",
] as const;

export type ParentChronicCondition = (typeof PARENT_CHRONIC_CONDITIONS)[number];

export interface ChronicConditionMeta {
  name: ParentChronicCondition;
  label: string;
  description: string;
  alertLevel: "critical" | "warning" | "advisory";
  badgeClass: string;
}

export const PARENT_CHRONIC_CONDITION_DETAILS: Record<
  ParentChronicCondition,
  ChronicConditionMeta
> = {
  "Mental Illness": {
    name: "Mental Illness",
    label: "Mental Illness",
    description: "Psychological / behavioral evaluation, therapy, or special classroom accommodation",
    alertLevel: "warning",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  "Epilepsy": {
    name: "Epilepsy",
    label: "Epilepsy",
    description: "Seizure disorder requiring emergency response protocol and monitoring",
    alertLevel: "critical",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
  "Depression": {
    name: "Depression",
    label: "Depression",
    description: "Clinical depression diagnosis, counseling, or mood stabilization support",
    alertLevel: "warning",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  "Chronic Nephritis": {
    name: "Chronic Nephritis",
    label: "Chronic Nephritis",
    description: "Chronic kidney inflammation, renal monitoring, or fluid/dietary considerations",
    alertLevel: "critical",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  "Uremia": {
    name: "Uremia",
    label: "Uremia",
    description: "Impaired renal filtration / elevated blood urea requiring urgent clinical awareness",
    alertLevel: "critical",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
  },
  "Infectious Disease": {
    name: "Infectious Disease",
    label: "Infectious Disease",
    description: "Active, recurring, or communicable infection requiring management or precautions",
    alertLevel: "critical",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
};
