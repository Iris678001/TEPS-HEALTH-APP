"use client";

import { useMemo, useState } from "react";
import {
  Printer,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  ArrowUpRight,
  Ruler,
  Weight,
  Activity,
  Wind,
  Eye as EyeIcon,
  ClipboardList,
  Syringe,
  FileText,
  LayoutGrid,
  AlertTriangle,
  Droplets,
  Calendar,
  IdCard,
  Ear,
  Stethoscope,
  Smile,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { academicYearKey, calculateAge, formatDate, getCurrentAcademicYear, initialsOf, parseStationRemarks } from "@/lib/helpers";
import { NUTRITION_BADGE_VARIANT } from "@/lib/constants";
import type {
  Attachment,
  HealthCheckup,
  Immunization,
  Observation,
  SessionUser,
  SpecialNeed,
  Student,
  StudentProfile,
} from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GrowthChart from "@/components/charts/growth-chart";
import StudentModal from "@/components/shrms/modals/student-modal";
import CheckupModal, { type CheckupStation } from "@/components/shrms/modals/checkup-modal";
import ImmunizationModal from "@/components/shrms/modals/immunization-modal";
import ParentVaccineModal from "@/components/shrms/modals/parent-vaccine-modal";
import ParentBloodGroupModal from "@/components/shrms/modals/parent-blood-group-modal";
import ParentConditionsModal from "@/components/shrms/modals/parent-conditions-modal";
import ParentCardModal from "@/components/shrms/modals/parent-card-modal";
import SpecialNeedsCard from "@/components/shrms/special-needs-card";
import AttachmentsCard from "@/components/shrms/attachments-card";
import PrintDialog from "@/components/shrms/print-card";

interface StudentDetailProps {
  profile: StudentProfile;
  readOnly: boolean;
  parentToken?: string;
  currentUser?: SessionUser | null;
  onChanged?: () => void;
  onBack?: () => void;
  onDeleted?: () => void;
  onVaccinesUpdated?: (updated: Immunization[]) => void;
  onStudentUpdated?: (updated: Student) => void;
  onSpecialNeedUpdated?: (updated: SpecialNeed) => void;
  onAttachmentsUpdated?: (updated: Attachment[]) => void;
}

interface DeleteTarget {
  description: string;
  run: () => Promise<void>;
}

export default function StudentDetail({
  profile,
  readOnly,
  parentToken,
  currentUser,
  onChanged,
  onBack,
  onDeleted,
  onVaccinesUpdated,
  onStudentUpdated,
  onSpecialNeedUpdated,
  onAttachmentsUpdated,
}: StudentDetailProps) {
  const { student, checkups, observations, immunizations, specialNeed, attachments } = profile;

  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [checkupModal, setCheckupModal] = useState<{
    open: boolean;
    checkup: HealthCheckup | null;
    initialStation?: CheckupStation;
  }>({
    open: false,
    checkup: null,
    initialStation: "general",
  });

  const openStationCheckup = (station: CheckupStation, specificCheckup?: HealthCheckup | null) => {
    const currentAY = getCurrentAcademicYear();
    const targetCheckup =
      specificCheckup !== undefined
        ? specificCheckup
        : checkups.find((c) => c.academicYear === currentAY) || (checkups.length > 0 ? checkups[checkups.length - 1] : null);

    setCheckupModal({
      open: true,
      checkup: targetCheckup || null,
      initialStation: station,
    });
  };
  const [immModal, setImmModal] = useState<{ open: boolean; immunization: Immunization | null }>({
    open: false,
    immunization: null,
  });
  const [parentVaccineModalOpen, setParentVaccineModalOpen] = useState(false);
  const [bloodGroupModalOpen, setBloodGroupModalOpen] = useState(false);
  const [parentConditionsModalOpen, setParentConditionsModalOpen] = useState(false);
  const [parentCardModalOpen, setParentCardModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const latest = checkups.length > 0 ? checkups[checkups.length - 1] : null;

  const age = useMemo(() => calculateAge(student.dob), [student.dob]);

  const growthData = useMemo(
    () =>
      [...checkups]
        .sort((a, b) => academicYearKey(a.academicYear) - academicYearKey(b.academicYear))
        .map((c) => ({
          academicYear: c.academicYear,
          height: c.height,
          weight: c.weight,
          bmi: c.bmi,
        })),
    [checkups]
  );

  function confirmDelete(description: string, run: () => Promise<void>) {
    setDeleteTarget({ description, run });
  }

  async function runDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTarget.run();
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5 font-sans">
      {/* ─── EHR Patient Demographic Banner ─── */}
      <Card className="border-slate-200 shadow-2xs rounded-md bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="h-16 w-16 rounded-md border border-slate-200 bg-slate-100 text-slate-800 text-lg font-bold font-mono flex items-center justify-center shrink-0 shadow-2xs">
              {initialsOf(student.studentName)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">{student.studentName}</h2>
                <span className="font-mono text-xs font-bold text-slate-800 border border-slate-300 bg-slate-50 px-2 py-0.5 rounded">
                  ID: {student.admissionNumber}
                </span>
                <span className="font-mono text-xs font-medium text-slate-700 border border-slate-200 bg-slate-50 px-2 py-0.5 rounded">
                  Class {student.class} · {student.section}
                </span>
                {age && (
                  <span
                    className="border border-emerald-300 bg-emerald-50 text-emerald-800 font-mono text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 shadow-2xs"
                    title={`Age calculated according to Date of Birth: ${formatDate(student.dob)} (${age.exact})`}
                  >
                    <Calendar className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>Age: {age.formatted}</span>
                    {age.months > 0 && age.years < 7 && (
                      <span className="text-[10px] text-emerald-700 font-normal">({age.exact})</span>
                    )}
                  </span>
                )}
                {parentToken ? (
                  <button
                    type="button"
                    onClick={() => setBloodGroupModalOpen(true)}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-semibold transition-all cursor-pointer border ${
                      student.bloodGroup === "N/A"
                        ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400 animate-pulse"
                        : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                    }`}
                    title="Click to update ward's blood group"
                  >
                    <Droplets className="h-3 w-3 text-rose-500 shrink-0" />
                    <span>{student.bloodGroup === "N/A" ? "Blood Group: Not Set" : student.bloodGroup}</span>
                    <span className="text-[10px] text-rose-600 underline font-normal ml-0.5">Edit</span>
                  </button>
                ) : (
                  <span className="border border-rose-300 bg-rose-50 text-rose-800 font-mono text-xs font-semibold px-2 py-0.5 rounded">
                    {student.bloodGroup}
                  </span>
                )}
              </div>

              {/* Demographics Tabular Grid */}
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs border-t border-slate-100 pt-2.5 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Gender</p>
                  <p className="font-medium text-slate-800 mt-0.5">{student.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Date of Birth</p>
                  <p className="font-mono text-slate-800 mt-0.5">{formatDate(student.dob)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Guardian / Parent</p>
                  <p className="font-medium text-slate-800 mt-0.5 truncate">{student.parentName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Primary Phone</p>
                  <p className="font-mono text-slate-800 mt-0.5">{student.phone}</p>
                </div>
                {student.aadhaarNumber && (
                  <div>
                    <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Aadhaar Card UID</p>
                    <p className="font-mono font-semibold text-slate-900 mt-0.5">{student.aadhaarNumber}</p>
                  </div>
                )}
                {student.emergencyContact && (
                  <div>
                    <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Emergency Phone</p>
                    <p className="font-mono text-slate-800 mt-0.5">{student.emergencyContact}</p>
                  </div>
                )}
                {student.identificationMarks && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Identification Marks</p>
                    <p className="text-slate-800 mt-0.5">{student.identificationMarks}</p>
                  </div>
                )}
                {student.address && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Residential Address</p>
                    <p className="text-slate-800 mt-0.5 truncate">{student.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap sm:flex-col gap-1.5 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-4">
              {!readOnly && (
                <>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setEditStudentOpen(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Demographics
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() =>
                        confirmDelete(
                          `Delete ${student.studentName} (${student.admissionNumber}) and ALL associated health records? This cannot be undone.`,
                          async () => {
                            await api(`/api/students/${encodeURIComponent(student.admissionNumber)}`, {
                              method: "DELETE",
                            });
                            toast.success("Student record deleted.");
                            onDeleted?.();
                          }
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Record
                    </Button>
                  )}
                </>
              )}
              {parentToken && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-blue-700 border-blue-200 bg-blue-50/70 hover:bg-blue-100 font-semibold"
                  onClick={() => setParentCardModalOpen(true)}
                >
                  <IdCard className="h-3.5 w-3.5 text-blue-600" />
                  Card Details
                </Button>
              )}
              {parentToken && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-rose-700 border-rose-200 bg-rose-50/50 hover:bg-rose-100"
                  onClick={() => setBloodGroupModalOpen(true)}
                >
                  <Droplets className="h-3.5 w-3.5 text-rose-500" />
                  Update Blood Group
                </Button>
              )}
              <Button size="sm" className="h-8 text-xs gap-1.5 font-semibold" onClick={() => setPrintOpen(true)}>
                <Printer className="h-3.5 w-3.5" />
                Print Health Card
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Tabs ─── */}
      <Tabs defaultValue="overview">
        <div className="overflow-x-auto pb-0.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <TabsList className="bg-slate-100/90 border border-slate-200 h-auto p-1 gap-1 rounded-md w-max">
            <TabsTrigger value="overview" className="rounded text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs data-[state=active]:font-semibold">
              <LayoutGrid className="h-3.5 w-3.5" />
              Clinical Overview
            </TabsTrigger>
            <TabsTrigger value="checkups" className="rounded text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs data-[state=active]:font-semibold">
              <ClipboardList className="h-3.5 w-3.5" />
              Annual Checkups ({checkups.length})
            </TabsTrigger>
            <TabsTrigger value="immunizations" className="rounded text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs data-[state=active]:font-semibold">
              <Syringe className="h-3.5 w-3.5" />
              Immunization Ledger ({immunizations.length})
            </TabsTrigger>
            <TabsTrigger value="special" className="rounded text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs data-[state=active]:font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              Special Care Protocol
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded text-xs font-medium gap-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs data-[state=active]:font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Medical Documents ({attachments.length})
            </TabsTrigger>
          </TabsList>

          {/* Clinical Age Indicator on tab row */}
          {age && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-200/90 bg-emerald-50/80 text-xs text-emerald-950 font-mono font-medium shrink-0 self-start sm:self-center shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                Calculated Age: <strong className="font-bold text-emerald-900">{age.formatted}</strong>
              </span>
              <span className="text-[10px] text-emerald-700 font-normal">
                (DOB: {formatDate(student.dob)})
              </span>
            </div>
          )}
        </div>

        {/* ─── Overview ─── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200 shadow-2xs rounded-md bg-white">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                  Latest Examination Summary
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 font-mono">
                  {latest
                    ? `Academic Year ${latest.academicYear} · Examined ${formatDate(latest.checkupDate)}`
                    : "No annual checkup recorded yet"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                {latest ? (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    <Metric icon={Ruler} label="Height" value={`${latest.height} cm`} />
                    <Metric icon={Weight} label="Weight" value={`${latest.weight} kg`} />
                    <Metric icon={Activity} label="BMI" value={String(latest.bmi)} />
                    <Metric
                      icon={EyeIcon}
                      label="Eyesight (L/R)"
                      value={`${latest.eyesightLeft} / ${latest.eyesightRight}`}
                    />
                    <Metric icon={Wind} label="Blood Pressure" value={latest.bloodPressure} />
                    <Metric icon={ClipboardList} label="Dental Health" value={latest.dentalHealth} />
                    <Metric
                      icon={Ear}
                      label="ENT Screening"
                      value={
                        [latest.entEars || "Normal", latest.entNose || "Normal", latest.entThroat || "Normal"].every(
                          (v) => v === "Normal"
                        )
                          ? "All Normal"
                          : `${latest.entEars || "Normal"} / ${latest.entNose || "Normal"} / ${latest.entThroat || "Normal"}`
                      }
                    />
                    <div className="col-span-2 sm:col-span-3 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2">
                      <div>
                        <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">Nutritional Status</p>
                        <Badge
                          variant="outline"
                          className={`mt-0.5 text-[10px] uppercase font-mono font-medium rounded px-1.5 py-0.2 ${NUTRITION_BADGE_VARIANT[latest.nutritionalStatus] || ""}`}
                        >
                          {latest.nutritionalStatus}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 text-right">
                        Examined by
                        <br />
                        <span className="font-semibold text-slate-800">{latest.doctorName}</span>
                      </p>
                    </div>
                    {(() => {
                      const remarks = parseStationRemarks(latest.nutritionRemarks, latest.entRemarks);
                      if (remarks.length === 0) return null;
                      return (
                        <div className="col-span-2 sm:col-span-3 text-xs text-slate-700 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 space-y-1.5">
                          <strong className="font-mono text-[10px] uppercase tracking-wider text-slate-500 block">
                            Clinical Station Assessment & Remarks:
                          </strong>
                          {remarks.map((r, idx) => (
                            <div key={idx} className="text-xs leading-relaxed">
                              <strong className="font-semibold text-slate-900">{r.tag}</strong>{" "}
                              <span className="text-slate-700">{r.text}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700">No annual checkup recorded yet</p>
                      <p className="text-xs text-slate-400">
                        {readOnly
                          ? "The first annual checkup has not been documented yet."
                          : "Choose a clinical examination station below to begin:"}
                      </p>
                    </div>
                    {!readOnly && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 font-medium border-sky-300 text-sky-800 hover:bg-sky-50"
                          onClick={() => openStationCheckup("general")}
                        >
                          <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
                          Add General Checkup
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 font-medium border-teal-300 text-teal-800 hover:bg-teal-50"
                          onClick={() => openStationCheckup("dental")}
                        >
                          <Smile className="h-3.5 w-3.5 text-teal-600" />
                          Add Dental Checkup
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 font-medium border-indigo-300 text-indigo-800 hover:bg-indigo-50"
                          onClick={() => openStationCheckup("eye")}
                        >
                          <EyeIcon className="h-3.5 w-3.5 text-indigo-600" />
                          Add Eye Checkup
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-2xs rounded-md bg-white">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                  Pediatric Growth Trajectory
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Anthropometric progression across academic years
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <GrowthChart data={growthData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Annual checkups ─── */}
        <TabsContent value="checkups" className="mt-4">
          <Card className="border-slate-200 shadow-2xs rounded-md bg-white">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                    Annual Clinical Examinations
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Certified annual health assessments (one record per academic year)
                  </CardDescription>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5 font-semibold bg-sky-700 hover:bg-sky-800 text-white shadow-2xs border border-sky-800"
                      onClick={() => openStationCheckup("general")}
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      Add General Checkup
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5 font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-2xs border border-teal-800"
                      onClick={() => openStationCheckup("dental")}
                    >
                      <Smile className="h-3.5 w-3.5" />
                      Add Dental Checkup
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5 font-semibold bg-indigo-700 hover:bg-indigo-800 text-white shadow-2xs border border-indigo-800"
                      onClick={() => openStationCheckup("eye")}
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      Add Eye Checkup
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {checkups.length === 0 ? (
                <EmptyState text="No annual checkups recorded yet." />
              ) : (
                <div className="max-h-96 overflow-y-auto overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>AY</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Ht (cm)</TableHead>
                        <TableHead>Wt (kg)</TableHead>
                        <TableHead>BMI</TableHead>
                        <TableHead>Eyes (L/R)</TableHead>
                        <TableHead>Dental</TableHead>
                        <TableHead>BP</TableHead>
                        <TableHead>Nutrition</TableHead>
                        <TableHead>ENT</TableHead>
                        <TableHead className="hidden md:table-cell">Remarks / Observations</TableHead>
                        <TableHead className="hidden lg:table-cell">Doctor</TableHead>
                        {!readOnly && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkups.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-xs font-medium whitespace-nowrap">
                            {c.academicYear}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(c.checkupDate)}
                          </TableCell>
                          <TableCell className="text-sm">{c.height}</TableCell>
                          <TableCell className="text-sm">{c.weight}</TableCell>
                          <TableCell className="text-sm font-semibold">{c.bmi}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {(c.eyesightLeft === "Pending Exam" || c.eyesightLeft === "Pending") &&
                            (c.eyesightRight === "Pending Exam" || c.eyesightRight === "Pending") ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-mono">
                                Pending
                              </Badge>
                            ) : (
                              `${c.eyesightLeft} / ${c.eyesightRight}`
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {c.dentalHealth === "Pending Exam" || c.dentalHealth === "Pending" ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-mono">
                                Pending
                              </Badge>
                            ) : (
                              c.dentalHealth
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{c.bloodPressure}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[11px] whitespace-nowrap ${NUTRITION_BADGE_VARIANT[c.nutritionalStatus] || ""}`}
                            >
                              {c.nutritionalStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {[c.entEars || "Normal", c.entNose || "Normal", c.entThroat || "Normal"].every(
                              (v) => v === "Normal"
                            ) ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                Normal
                              </Badge>
                            ) : (
                              <div className="text-[11px] leading-tight space-y-0.5" title={c.entRemarks || ""}>
                                {c.entEars && c.entEars !== "Normal" && (
                                  <div className="text-amber-800 font-medium">E: {c.entEars}</div>
                                )}
                                {c.entNose && c.entNose !== "Normal" && (
                                  <div className="text-orange-800 font-medium">N: {c.entNose}</div>
                                )}
                                {c.entThroat && c.entThroat !== "Normal" && (
                                  <div className="text-red-800 font-medium">T: {c.entThroat}</div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-64">
                            {(() => {
                              const remarks = parseStationRemarks(c.nutritionRemarks, c.entRemarks);
                              if (remarks.length === 0) return <span>—</span>;
                              return (
                                <div className="space-y-1 py-0.5">
                                  {remarks.map((r, idx) => (
                                    <div key={idx} className="text-[11px] leading-tight" title={`${r.tag} ${r.text}`}>
                                      <span className="font-semibold text-slate-800">{r.tag}</span>{" "}
                                      <span className="text-slate-600 truncate inline-block max-w-[180px] align-bottom">
                                        {r.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                            {c.doctorName}
                          </TableCell>
                          {!readOnly && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Edit checkup"
                                  onClick={() =>
                                    setCheckupModal({
                                      open: true,
                                      checkup: c,
                                      initialStation:
                                        currentUser?.role === "doctor_dental"
                                          ? "dental"
                                          : currentUser?.role === "doctor_eye"
                                          ? "eye"
                                          : "general",
                                    })
                                  }
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  aria-label="Delete checkup"
                                  onClick={() =>
                                    confirmDelete(
                                      `Delete the ${c.academicYear} health checkup?`,
                                      async () => {
                                        await api(`/api/checkups/${c.id}`, { method: "DELETE" });
                                        toast.success("Checkup deleted.");
                                        onChanged?.();
                                      }
                                    )
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Immunizations ─── */}
        <TabsContent value="immunizations" className="mt-4">
          <Card className="border-slate-200 shadow-2xs rounded-md bg-white">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                    Immunization Ledger &amp; Vaccine Records
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Officially documented pediatric vaccinations and booster schedules
                  </CardDescription>
                </div>
                {!readOnly ? (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 font-semibold"
                    onClick={() => setImmModal({ open: true, immunization: null })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Record Vaccine
                  </Button>
                ) : parentToken ? (
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs font-semibold"
                    onClick={() => setParentVaccineModalOpen(true)}
                  >
                    <Syringe className="h-3.5 w-3.5" />
                    Declare Child Vaccinations
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {immunizations.length === 0 ? (
                <EmptyState text="No immunization records yet." />
              ) : (
                <div className="max-h-96 overflow-y-auto overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>Vaccine</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Dose</TableHead>
                        <TableHead>Next Due</TableHead>
                        <TableHead className="hidden md:table-cell">Remarks</TableHead>
                        {!readOnly && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {immunizations.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell className="text-sm font-medium">{i.vaccine}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(i.date)}
                          </TableCell>
                          <TableCell className="text-sm">{i.dose}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {i.nextDue ? formatDate(i.nextDue) : "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-56">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {i.remarks?.includes("Declared by Parent") && (
                                <Badge
                                  variant="outline"
                                  className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] px-1.5 py-0 h-4 font-normal shrink-0"
                                >
                                  Parent Declared
                                </Badge>
                              )}
                              <span className="truncate">
                                {i.remarks?.replace(" (Declared by Parent)", "").replace("Declared by Parent", "").trim() || (i.remarks?.includes("Declared by Parent") ? "" : "—")}
                              </span>
                            </div>
                          </TableCell>
                          {!readOnly && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Edit vaccination"
                                  onClick={() => setImmModal({ open: true, immunization: i })}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  aria-label="Delete vaccination"
                                  onClick={() =>
                                    confirmDelete(
                                      `Delete the ${i.vaccine} (${i.dose}) record?`,
                                      async () => {
                                        await api(`/api/immunizations/${i.id}`, {
                                          method: "DELETE",
                                        });
                                        toast.success("Vaccination record deleted.");
                                        onChanged?.();
                                      }
                                    )
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Special needs ─── */}
        <TabsContent value="special" className="mt-4">
          <SpecialNeedsCard
            specialNeed={specialNeed}
            admissionNumber={student.admissionNumber}
            readOnly={readOnly}
            parentToken={parentToken}
            onOpenConditionsModal={() => setParentConditionsModalOpen(true)}
            onChanged={onChanged}
          />
        </TabsContent>

        {/* ─── Documents ─── */}
        <TabsContent value="documents" className="mt-4">
          <AttachmentsCard
            attachments={attachments}
            admissionNumber={student.admissionNumber}
            readOnly={readOnly}
            parentToken={parentToken}
            onChanged={onChanged}
            onAttachmentAdded={(newAtt) => {
              if (onAttachmentsUpdated) {
                onAttachmentsUpdated([newAtt, ...attachments]);
              }
              onChanged?.();
            }}
            onAttachmentDeleted={(deletedId) => {
              if (onAttachmentsUpdated) {
                onAttachmentsUpdated(attachments.filter((a) => a.id !== deletedId));
              }
              onChanged?.();
            }}
          />
        </TabsContent>
      </Tabs>

      {/* ─── Modals ─── */}
      <StudentModal
        open={editStudentOpen}
        onOpenChange={setEditStudentOpen}
        onSaved={onChanged || (() => {})}
        student={student}
      />
      <CheckupModal
        open={checkupModal.open}
        onOpenChange={(open) => setCheckupModal((prev) => ({ ...prev, open }))}
        onSaved={onChanged || (() => {})}
        admissionNumber={student.admissionNumber}
        studentName={student.studentName}
        studentDob={student.dob}
        checkup={checkupModal.checkup}
        currentUser={currentUser}
        initialStation={checkupModal.initialStation}
      />
      <ImmunizationModal
        open={immModal.open}
        onOpenChange={(open) => setImmModal({ open, immunization: immModal.immunization })}
        onSaved={onChanged || (() => {})}
        admissionNumber={student.admissionNumber}
        studentName={student.studentName}
        studentDob={student.dob}
        immunization={immModal.immunization}
      />
      {parentToken && (
        <ParentVaccineModal
          open={parentVaccineModalOpen}
          onOpenChange={setParentVaccineModalOpen}
          admissionNumber={student.admissionNumber}
          studentName={student.studentName}
          parentToken={parentToken}
          existingImmunizations={immunizations}
          onSaved={(updated) => {
            onVaccinesUpdated?.(updated);
            onChanged?.();
          }}
        />
      )}
      {parentToken && (
        <ParentBloodGroupModal
          open={bloodGroupModalOpen}
          onOpenChange={setBloodGroupModalOpen}
          admissionNumber={student.admissionNumber}
          studentName={student.studentName}
          currentBloodGroup={student.bloodGroup}
          parentToken={parentToken}
          onSaved={(updated) => {
            onStudentUpdated?.(updated);
            onChanged?.();
          }}
        />
      )}
      {parentToken && (
        <ParentConditionsModal
          open={parentConditionsModalOpen}
          onOpenChange={setParentConditionsModalOpen}
          admissionNumber={student.admissionNumber}
          studentName={student.studentName}
          parentToken={parentToken}
          specialNeed={specialNeed}
          onSaved={(updated) => {
            onSpecialNeedUpdated?.(updated);
            onChanged?.();
          }}
        />
      )}
      {parentToken && (
        <ParentCardModal
          open={parentCardModalOpen}
          onOpenChange={setParentCardModalOpen}
          student={student}
          parentToken={parentToken}
          onSaved={(updated) => {
            onStudentUpdated?.(updated);
            onChanged?.();
          }}
        />
      )}
      <PrintDialog open={printOpen} onOpenChange={setPrintOpen} profile={profile} />

      {/* ─── Delete confirmation ─── */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                runDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5 shadow-2xs">
      <p className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-600 shrink-0" />
        {label}
      </p>
      <p className="mt-1 text-sm font-bold font-mono text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-xs text-slate-400 font-mono">{text}</p>
    </div>
  );
}
