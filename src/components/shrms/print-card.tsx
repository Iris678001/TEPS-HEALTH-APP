"use client";

import { SCHOOL_NAME, SCHOOL_MOTTO, CBSE_AFFILIATION, SCHOOL_LOGO } from "@/lib/constants";
import { formatDate, formatDateTime, parseStationRemarks } from "@/lib/helpers";
import type { StudentProfile } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile;
}

/**
 * Print-friendly annual health card. The .print-area CSS rule in globals.css
 * ensures only this card is printed (browsers can also "Save as PDF").
 */
export default function PrintDialog({ open, onOpenChange, profile }: PrintDialogProps) {
  const { student, checkups, observations, immunizations, specialNeed, attachments } = profile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-4xl max-h-[92vh] overflow-y-auto print-area bg-white">
        <DialogHeader className="no-print">
          <DialogTitle>Print / Export Health Card</DialogTitle>
          <DialogDescription>
            Use the print dialog and choose &quot;Save as PDF&quot; to export a copy.
          </DialogDescription>
        </DialogHeader>

        <div className="px-1 text-slate-900">
          {/* Header / Letterhead */}
          <div className="text-center border-b-2 border-slate-900 pb-4 pt-1">
            <div className="flex items-center justify-center gap-4 mb-2">
              <img
                src={SCHOOL_LOGO}
                alt={SCHOOL_NAME}
                className="h-16 w-16 object-contain"
              />
              <div className="text-left sm:text-center">
                <h1 className="text-xl font-black tracking-wide uppercase text-slate-900 leading-tight">
                  {SCHOOL_NAME}
                </h1>
                <p className="text-[11px] font-semibold tracking-widest text-amber-700 uppercase mt-0.5">
                  {SCHOOL_MOTTO}
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  {CBSE_AFFILIATION}
                </p>
              </div>
            </div>
            <div className="inline-block bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded mt-1">
              Student Annual Health Record Card
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Generated on {formatDateTime(new Date().toISOString())} · School Health Record Management System
            </p>
          </div>

          {/* Student info */}
          <section className="mt-4 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
              Student Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
              <Info label="Student Name" value={student.studentName} />
              <Info label="Class / Section" value={`${student.class} - ${student.section}`} />
              <Info label="Gender" value={student.gender} />
              <Info label="Date of Birth" value={formatDate(student.dob)} />
              <Info label="Blood Group" value={student.bloodGroup} />
              <Info label="Parent / Guardian" value={student.parentName} />
              <Info label="Primary Phone" value={student.phone} />
              <Info label="Aadhaar Card UID" value={student.aadhaarNumber || "—"} mono />
              <Info label="Emergency Contact" value={student.emergencyContact || "—"} />
              <Info label="Visible ID Marks" value={student.identificationMarks || "—"} />
              <Info label="Residential Address" value={student.address || "—"} className="sm:col-span-3" />
            </div>
          </section>

          {/* Checkups */}
          <section className="mt-5 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
              Annual Health Checkups
            </h3>
            <PrintTable
              headers={["AY", "Date", "Ht (cm)", "Wt (kg)", "BMI", "Eyes L", "Eyes R", "Dental", "BP", "Nutrition", "ENT (E/N/T)", "Remarks / Observations", "Doctor"]}
              rows={checkups.map((c) => {
                const abnormalEnt = [
                  c.entEars && c.entEars !== "Normal" ? `E: ${c.entEars}` : null,
                  c.entNose && c.entNose !== "Normal" ? `N: ${c.entNose}` : null,
                  c.entThroat && c.entThroat !== "Normal" ? `T: ${c.entThroat}` : null,
                ].filter(Boolean).join("; ");
                const entDisplay = abnormalEnt
                  ? abnormalEnt
                  : (c.entEars || c.entNose || c.entThroat)
                  ? "Normal"
                  : "—";

                const stationRemarks = parseStationRemarks(c.nutritionRemarks, c.entRemarks);
                const remarksNode = stationRemarks.length > 0 ? (
                  <div className="space-y-1 text-[10px] leading-tight max-w-xs">
                    {stationRemarks.map((sr, idx) => (
                      <div key={idx} className="break-words">
                        <span className="font-bold text-slate-900">{sr.tag}</span>{" "}
                        <span className="text-slate-700">{sr.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  "—"
                );

                return [
                  c.academicYear,
                  formatDate(c.checkupDate),
                  String(c.height),
                  String(c.weight),
                  String(c.bmi),
                  c.eyesightLeft,
                  c.eyesightRight,
                  c.dentalHealth,
                  c.bloodPressure,
                  c.nutritionalStatus,
                  entDisplay,
                  remarksNode,
                  c.doctorName,
                ];
              })}
              empty="No checkups recorded."
            />
          </section>

          {/* Immunizations */}
          <section className="mt-5 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
              Immunization History
            </h3>
            <PrintTable
              headers={["Vaccine", "Date", "Dose", "Next Due", "Remarks"]}
              rows={immunizations.map((i) => [
                i.vaccine,
                formatDate(i.date),
                i.dose,
                i.nextDue ? formatDate(i.nextDue) : "—",
                i.remarks || "—",
              ])}
              empty="No immunization records."
            />
          </section>

          {/* Doctor & Nurse Observations (Legacy records if present) */}
          {observations.length > 0 && (
            <section className="mt-5 break-inside-avoid">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
                Doctor &amp; Nurse Observations
              </h3>
              <PrintTable
                headers={["Academic Year", "Observation", "Follow-up Recommendation"]}
                rows={observations.map((o) => [o.academicYear, o.observation, o.recommendation])}
                empty="No observations recorded."
              />
            </section>
          )}

          {/* Special needs */}
          <section className="mt-5 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
              Special Needs & Medical Alerts
            </h3>
            {specialNeed && hasSpecialNeeds(specialNeed) ? (
              <div className="text-xs space-y-1.5">
                {(
                  [
                    ["Allergies", specialNeed.allergies],
                    ["Chronic Illness / Medical Disclosures", specialNeed.chronicIllness],
                    ["Disabilities", specialNeed.disabilities],
                    ["Learning Difficulties", specialNeed.learningDifficulties],
                    ["Medication", specialNeed.medication],
                    ["Emergency Notes", specialNeed.emergencyNotes],
                  ] as const
                ).map(
                  ([label, value]) =>
                    value && (
                      <div
                        key={label}
                        className={
                          label.includes("Chronic")
                            ? "p-2 rounded bg-amber-50/80 border border-amber-300 text-amber-950"
                            : ""
                        }
                      >
                        <span className="font-bold text-slate-900">{label}:</span>{" "}
                        <span className={label.includes("Chronic") ? "font-semibold" : ""}>{value}</span>
                        {label.includes("Chronic") && (
                          <span className="ml-2 inline-block px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                            Medical Alert
                          </span>
                        )}
                      </div>
                    )
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">None recorded.</p>
            )}
          </section>

          {/* Documents */}
          {attachments.length > 0 && (
            <section className="mt-5 break-inside-avoid">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">
                Attached Documents ({attachments.length})
              </h3>
              <ul className="text-xs space-y-0.5">
                {attachments.map((a) => (
                  <li key={a.id}>
                    • {a.filename} <span className="text-slate-500">({a.category})</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-slate-300 pt-4 flex justify-between items-end text-xs">
            <div>
              <p className="font-semibold text-slate-800">{SCHOOL_NAME}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">
                Computer-generated official student health record · Valid with school seal.
              </p>
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <div className="w-32 border-t border-slate-400 mt-8 pt-1 text-slate-600 text-[11px]">
                  School Seal
                </div>
              </div>
              <div>
                <div className="w-36 border-t border-slate-400 mt-8 pt-1 text-slate-600 text-[11px]">
                  Medical Officer / Doctor
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="no-print gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <p className={className}>
      <span className="text-slate-500">{label}: </span>
      <span className={`font-semibold ${mono ? "font-mono" : ""}`}>{value}</span>
    </p>
  );
}

function PrintTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: (React.ReactNode)[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-slate-500">{empty}</p>;
  }
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              className="border border-slate-300 bg-slate-100 text-slate-800 px-1.5 py-1 text-left font-semibold whitespace-nowrap"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className="border border-slate-300 px-1.5 py-1 align-top">
                {cell || "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function hasSpecialNeeds(sn: NonNullable<StudentProfile["specialNeed"]>): boolean {
  return Boolean(
    sn.allergies ||
      sn.chronicIllness ||
      sn.disabilities ||
      sn.learningDifficulties ||
      sn.medication ||
      sn.emergencyNotes
  );
}
