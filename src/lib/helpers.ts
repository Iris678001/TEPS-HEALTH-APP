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

/** Format an ISO date string or Date as "14 May 2013" (UTC-stable, hydration safe) */
export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Format an ISO datetime string or Date as "14 May 2013, 10:24 AM" (local time) */
export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
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

/**
 * Calculate student age in years and months from date of birth to current year.
 * Returns null if dob is missing or invalid.
 */
export function calculateAge(dob: string | Date | null | undefined): {
  years: number;
  months: number;
  formatted: string;
  exact: string;
} | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) {
    years = 0;
    months = 0;
  }

  const formatted = `${years} yrs`;
  const exact =
    years === 0
      ? `${months} mos`
      : months > 0 && years < 10
      ? `${years}y ${months}m`
      : `${years} yrs`;

  return {
    years,
    months,
    formatted,
    exact,
  };
}

export interface StationRemark {
  station: "General" | "Dental" | "Eye" | "ENT" | "Clinical";
  doctorName?: string;
  text: string;
  tag: string;
}

/**
 * Parses a combined remarks string and optional entRemarks into structured station remarks.
 * Handles:
 *  - Tagged lines like `[Dental · Dr. Kabir Rao]: Mild tartar on lower incisors.`
 *  - Untagged legacy text (treated as General / Clinical).
 *  - Independent entRemarks (tagged as [ENT]).
 */
export function parseStationRemarks(
  rawRemarks: string | null | undefined,
  entRemarks?: string | null | undefined
): StationRemark[] {
  const results: StationRemark[] = [];
  const text = (rawRemarks || "").trim();

  if (text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      const match = line.match(/^\[(Dental|Eye|General|Nurse|Clinical)(?:\s*·\s*([^\]]+))?\]:\s*(.*)$/i);
      if (match) {
        const rawStation = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        const station = (
          rawStation === "Dental" || rawStation === "Eye" || rawStation === "General" || rawStation === "Nurse"
            ? rawStation
            : "Clinical"
        ) as StationRemark["station"];
        const docName = match[2]?.trim();
        const content = match[3]?.trim();
        results.push({
          station,
          doctorName: docName,
          text: content,
          tag: docName ? `[${station} · ${docName}]:` : `[${station}]:`,
        });
      } else {
        results.push({
          station: "General",
          text: line,
          tag: "[General]:",
        });
      }
    }
  }

  // Include ENT remarks if present and not already listed
  const ent = (entRemarks || "").trim();
  if (ent && !results.some((r) => r.station === "ENT")) {
    results.push({
      station: "ENT",
      text: ent,
      tag: "[ENT]:",
    });
  }

  return results;
}

/**
 * Extracts only the remark text specific to a station role from a combined remarks string.
 * Used by the checkup modal so a doctor only edits their own station's notes.
 */
export function extractStationRemark(
  rawRemarks: string | null | undefined,
  role: string
): { currentText: string; otherRemarks: StationRemark[] } {
  const all = parseStationRemarks(rawRemarks);
  const cleanRole = (role || "").toLowerCase();

  if (cleanRole === "admin") {
    return {
      currentText: rawRemarks || "",
      otherRemarks: [],
    };
  }

  const targetStation =
    cleanRole === "doctor_dental"
      ? "Dental"
      : cleanRole === "doctor_eye"
      ? "Eye"
      : "General";

  const mine = all.find((r) => r.station === targetStation);
  const others = all.filter((r) => r.station !== targetStation && r.station !== "ENT");

  return {
    currentText:
      mine?.text ||
      (targetStation === "General" && all.length === 1 && !all[0].doctorName ? all[0].text : ""),
    otherRemarks: others,
  };
}

/**
 * Merges a station's newly entered remark into the existing combined remarks string.
 * Preserves other doctors' remarks and attributes this station's remarks to the current doctor.
 */
export function mergeStationRemarks(
  existingRemarks: string | null | undefined,
  newStationText: string | undefined | null,
  role: string,
  doctorName: string
): string | null {
  const text = (newStationText ?? "").trim();
  const cleanRole = (role || "").toLowerCase();

  if (cleanRole === "admin") {
    return text || null;
  }

  const targetStation =
    cleanRole === "doctor_dental"
      ? "Dental"
      : cleanRole === "doctor_eye"
      ? "Eye"
      : "General";

  const all = parseStationRemarks(existingRemarks).filter(
    (r) => r.station !== targetStation && r.station !== "ENT"
  );

  const cleanDoctor = doctorName
    .replace(/\s*\((Dental|Eye|General|Physician|Dentist|Ophthalmologist|Ophthalmology|Nurse)\)/i, "")
    .trim();
  const tagPrefix = cleanDoctor ? `[${targetStation} · ${cleanDoctor}]` : `[${targetStation}]`;

  const updatedEntries: string[] = [];

  // Retain other stations' remarks
  for (const item of all) {
    if (item.doctorName) {
      updatedEntries.push(`[${item.station} · ${item.doctorName}]: ${item.text}`);
    } else {
      updatedEntries.push(`[${item.station}]: ${item.text}`);
    }
  }

  // Add or update this station's remarks
  if (text) {
    const cleanContent = text.replace(/^\[(Dental|Eye|General|Nurse|Clinical)[^\]]*\]:\s*/i, "").trim();
    if (cleanContent) {
      updatedEntries.push(`${tagPrefix}: ${cleanContent}`);
    }
  }

  if (updatedEntries.length === 0) return null;
  return updatedEntries.join("\n");
}


