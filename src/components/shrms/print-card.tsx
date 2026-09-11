"use client";

import { SCHOOL_NAME } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/helpers";
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
          {/* Header */}
          <div className="text-center border-b-2 border-blue-700 pb-3">
            <p className="text-lg font-bold tracking-wide uppercase">{SCHOOL_NAME}</p>
            <p className="text-sm font-semibold text-blue-700">Student Annual Health Record Card</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Generated {formatDateTime(new Date().toISOString())} · School Health Record Management System
            </p>
          </div>

          {/* Student info */}
          <section className="mt-4 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
              Student Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
              <Info label="Admission No." value={student.admissionNumber} mono />
              <Info label="Student Name" value={student.studentName} />
              <Info label="Class / Section" value={`${student.class} - ${student.section}`} />
              <Info label="Gender" value={student.gender} />
              <Info label="Date of Birth" value={formatDate(student.dob)} />
              <Info label="Blood Group" value={student.bloodGroup} />
              <Info label="Parent / Guardian" value={student.parentName} />
              <Info label="Contact Number" value={student.phone} />
            </div>
          </section>

          {/* Checkups */}
          <section className="mt-5 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
              Annual Health Checkups
            </h3>
            <PrintTable
              headers={["AY", "Date", "Ht (cm)", "Wt (kg)", "BMI", "Eyes L", "Eyes R", "Dental", "BP", "Nutrition", "Doctor"]}
              rows={checkups.map((c) => [
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
                c.doctorName,
              ])}
              empty="No checkups recorded."
            />
          </section>

          {/* Immunizations */}
          <section className="mt-5 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
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

          {/* Observations */}
          <section className="mt-5 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
              Doctor & Nurse Observations
            </h3>
            <PrintTable
              headers={["Academic Year", "Observation", "Follow-up Recommendation"]}
              rows={observations.map((o) => [o.academicYear, o.observation, o.recommendation])}
              empty="No observations recorded."
            />
          </section>

          {/* Special needs */}
          <section className="mt-5 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
              Special Needs
            </h3>
            {specialNeed && hasSpecialNeeds(specialNeed) ? (
              <div className="text-xs space-y-1">
                {(
                  [
                    ["Allergies", specialNeed.allergies],
                    ["Chronic Illness", specialNeed.chronicIllness],
                    ["Disabilities", specialNeed.disabilities],
                    ["Learning Difficulties", specialNeed.learningDifficulties],
                    ["Medication", specialNeed.medication],
                    ["Emergency Notes", specialNeed.emergencyNotes],
                  ] as const
                ).map(
                  ([label, value]) =>
                    value && (
                      <p key={label}>
                        <span className="font-semibold">{label}:</span> {value}
                      </p>
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
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
          <div className="mt-6 border-t pt-3 flex justify-between items-end text-xs">
            <p className="text-slate-500">
              Computer-generated record — valid with school seal.
            </p>
            <div className="text-center">
              <div className="w-40 border-t border-slate-400 mt-8 pt-1 text-slate-600">
                School Doctor&apos;s Signature
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

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <p>
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
  rows: string[][];
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
              className="border border-slate-300 bg-blue-50 px-1.5 py-1 text-left font-semibold whitespace-nowrap"
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
