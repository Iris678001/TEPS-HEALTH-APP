// ─── Domain constants & option lists ────────────────────────────────────────

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

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

export const COMMON_VACCINES = [
  "DPT Booster",
  "MMR",
  "Tdap",
  "Typhoid",
  "Hepatitis B",
  "Chickenpox",
  "Polio",
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

export const CLASSES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"] as const;

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

export const APP_NAME = "School Health Record Management System";
export const APP_SHORT_NAME = "SHRMS";
export const SCHOOL_NAME = "Sunrise Public School";
