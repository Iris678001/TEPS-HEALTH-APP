export type {
  StaffRole,
  StaffRoleConfig,
  DoctorFieldPermissions,
  ParentChronicCondition,
  ChronicConditionMeta,
} from "./constants";
export { PARENT_CHRONIC_CONDITIONS, PARENT_CHRONIC_CONDITION_DETAILS } from "./constants";

export interface SessionUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface DoctorStaff {
  id: number;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface Student {
  admissionNumber: string;
  studentName: string;
  class: string;
  section: string;
  gender: string;
  dob: string; // ISO date string
  bloodGroup: string;
  parentName: string;
  phone: string;
  aadhaarNumber?: string | null;
  address?: string | null;
  identificationMarks?: string | null;
  emergencyContact?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckup {
  id: number;
  admissionNumber: string;
  academicYear: string;
  checkupDate: string; // ISO
  height: number; // cm
  weight: number; // kg
  bmi: number;
  eyesightLeft: string;
  eyesightRight: string;
  dentalHealth: string;
  bloodPressure: string;
  nutritionalStatus: string;
  nutritionRemarks: string | null;
  entEars?: string | null;
  entNose?: string | null;
  entThroat?: string | null;
  entRemarks?: string | null;
  doctorName: string;
}

export interface Observation {
  id: number;
  admissionNumber: string;
  academicYear: string;
  observation: string;
  recommendation: string;
}

export interface Immunization {
  id: number;
  admissionNumber: string;
  vaccine: string;
  date: string; // ISO
  dose: string;
  nextDue: string | null; // ISO
  remarks: string | null;
}

export interface SpecialNeed {
  id: number;
  admissionNumber: string;
  allergies: string | null;
  chronicIllness: string | null;
  disabilities: string | null;
  learningDifficulties: string | null;
  medication: string | null;
  emergencyNotes: string | null;
  updatedAt: string;
}

export interface Attachment {
  id: number;
  admissionNumber: string;
  filename: string;
  fileUrl: string;
  category: string;
  uploadedDate: string; // ISO
}

export interface StudentProfile {
  student: Student;
  checkups: HealthCheckup[];
  observations: Observation[];
  immunizations: Immunization[];
  specialNeed: SpecialNeed | null;
  attachments: Attachment[];
}

export interface StudentListRow {
  admissionNumber: string;
  studentName: string;
  class: string;
  section: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  parentName: string;
  phone: string;
  hasRecordThisYear: boolean;
  updatedAt: string;
}

export interface StudentListResponse {
  data: StudentListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FollowUpItem {
  admissionNumber: string;
  studentName: string;
  class: string;
  section: string;
  reasons: string[];
}

export interface RecentCheckupItem {
  id: number;
  admissionNumber: string;
  studentName: string;
  class: string;
  section: string;
  academicYear: string;
  checkupDate: string;
  nutritionalStatus: string;
  doctorName: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalCheckups: number;
  currentAcademicYear: string;
  pendingThisYear: number;
  followUpCount: number;
  followUps: FollowUpItem[];
  recentCheckups: RecentCheckupItem[];
  nutritionDistribution: { status: string; count: number }[];
  checkupsByClass: { label: string; checkups: number; students: number }[];
}

export interface ActivityLogEntry {
  id: number;
  actor: string;
  role: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface ActivityLogResponse {
  data: ActivityLogEntry[];
  total: number;
}

/** Response of POST /api/parent/verify */
export interface ParentAccess {
  profile: StudentProfile;
  token: string; // short-lived token used to fetch attachment files
}

// ─── Chart input shapes ──────────────────────────────────────────────────────

export interface GrowthPoint {
  academicYear: string;
  height: number; // cm
  weight: number; // kg
  bmi: number;
}
