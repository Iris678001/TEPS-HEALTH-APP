import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Academic year runs April → March (Indian school calendar).
 * e.g. April 2025 – March 2026 => "2025-2026"
 */
export function getCurrentAcademicYear(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based; 3 === April
  const start = m >= 3 ? y : y - 1;
  return `${start}-${start + 1}`;
}

/** Sort key for an academic year label like "2024-2025" */
export function academicYearKey(ay: string): number {
  const start = parseInt(ay.split("-")[0] ?? "0", 10);
  return isNaN(start) ? 0 : start;
}

/** BMI = weight (kg) / height (m)²  — rounded to 1 decimal */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** Format an ISO date string as "14 May 2013" (UTC-stable, hydration safe) */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Format an ISO datetime as "14 May 2013, 10:24 AM" (local time) */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
