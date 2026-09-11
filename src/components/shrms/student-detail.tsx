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
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { academicYearKey, formatDate, initialsOf } from "@/lib/helpers";
import { NUTRITION_BADGE_VARIANT } from "@/lib/constants";
import type {
  HealthCheckup,
  Immunization,
  Observation,
  SessionUser,
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
import CheckupModal from "@/components/shrms/modals/checkup-modal";
import ObservationModal from "@/components/shrms/modals/observation-modal";
import ImmunizationModal from "@/components/shrms/modals/immunization-modal";
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
}: StudentDetailProps) {
  const { student, checkups, observations, immunizations, specialNeed, attachments } = profile;

  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [checkupModal, setCheckupModal] = useState<{ open: boolean; checkup: HealthCheckup | null }>({
    open: false,
    checkup: null,
  });
  const [obsModal, setObsModal] = useState<{ open: boolean; observation: Observation | null }>({
    open: false,
    observation: null,
  });
  const [immModal, setImmModal] = useState<{ open: boolean; immunization: Immunization | null }>({
    open: false,
    immunization: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const latest = checkups.length > 0 ? checkups[checkups.length - 1] : null;

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
    <div className="space-y-5">
      {/* ─── Header card ─── */}
      <Card className="border-blue-100 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-16 w-16 border-2 border-blue-100 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {initialsOf(student.studentName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{student.studentName}</h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {student.admissionNumber}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Class {student.class} · {student.section}
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-semibold">
                  {student.bloodGroup}
                </Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-4">
                <p>
                  <span className="text-slate-500">Gender: </span>
                  <span className="font-medium text-slate-700">{student.gender}</span>
                </p>
                <p>
                  <span className="text-slate-500">DOB: </span>
                  <span className="font-medium text-slate-700">{formatDate(student.dob)}</span>
                </p>
                <p>
                  <span className="text-slate-500">Parent: </span>
                  <span className="font-medium text-slate-700">{student.parentName}</span>
                </p>
                <p>
                  <span className="text-slate-500">Contact: </span>
                  <span className="font-medium text-slate-700">{student.phone}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {!readOnly && (
                <>
                  <Button variant="outline" className="gap-2" onClick={() => setEditStudentOpen(true)}>
                    <Pencil className="h-4 w-4" />
                    Edit Details
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() =>
                      confirmDelete(
                        `Delete ${student.studentName} (${student.admissionNumber}) and ALL associated health records? This cannot be undone.`,
                        async () => {
                          await api(`/api/students/${encodeURIComponent(student.admissionNumber)}`, {
                            method: "DELETE",
                          });
                          toast.success("Student deleted.");
                          onDeleted?.();
                        }
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
              <Button className="gap-2" onClick={() => setPrintOpen(true)}>
                <Printer className="h-4 w-4" />
                Print / PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Tabs ─── */}
      <Tabs defaultValue="overview">
        <div className="overflow-x-auto pb-0.5">
          <TabsList className="bg-white border h-auto p-1 gap-1">
            <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <LayoutGrid className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="checkups" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <ClipboardList className="h-3.5 w-3.5" />
              Annual Checkups ({checkups.length})
            </TabsTrigger>
            <TabsTrigger value="immunizations" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Syringe className="h-3.5 w-3.5" />
              Immunizations ({immunizations.length})
            </TabsTrigger>
            <TabsTrigger value="observations" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <FileText className="h-3.5 w-3.5" />
              Observations ({observations.length})
            </TabsTrigger>
            <TabsTrigger value="special" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <AlertTriangle className="h-3.5 w-3.5" />
              Special Needs
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Documents ({attachments.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── Overview ─── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Latest Checkup Summary</CardTitle>
                <CardDescription>
                  {latest
                    ? `Academic year ${latest.academicYear} · examined ${formatDate(latest.checkupDate)}`
                    : "No annual checkup recorded yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {latest ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Metric icon={Ruler} label="Height" value={`${latest.height} cm`} />
                    <Metric icon={Weight} label="Weight" value={`${latest.weight} kg`} />
                    <Metric icon={Activity} label="BMI" value={String(latest.bmi)} />
                    <Metric
                      icon={EyeIcon}
                      label="Eyesight (L/R)"
                      value={`${latest.eyesightLeft} / ${latest.eyesightRight}`}
                    />
                    <Metric icon={Wind} label="Blood Pressure" value={latest.bloodPressure} />
                    <Metric icon={ClipboardList} label="Dental" value={latest.dentalHealth} />
                    <div className="col-span-2 sm:col-span-3 flex items-center justify-between rounded-lg border bg-slate-50/60 px-3 py-2.5">
                      <div>
                        <p className="text-xs text-slate-500">Nutritional Status</p>
                        <Badge
                          variant="outline"
                          className={`mt-0.5 ${NUTRITION_BADGE_VARIANT[latest.nutritionalStatus] || ""}`}
                        >
                          {latest.nutritionalStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        Examined by
                        <br />
                        <span className="font-medium text-slate-700">{latest.doctorName}</span>
                      </p>
                    </div>
                    {latest.nutritionRemarks ? (
                      <p className="col-span-2 sm:col-span-3 text-xs text-muted-foreground rounded-lg bg-blue-50/60 border border-blue-100 px-3 py-2">
                        <span className="font-medium text-blue-800">Remarks: </span>
                        {latest.nutritionRemarks}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      {readOnly
                        ? "The first annual checkup has not been recorded yet."
                        : "Add the first annual checkup from the Annual Checkups tab."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Growth Chart</CardTitle>
                <CardDescription>Height, weight and BMI across academic years</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <GrowthChart data={growthData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Annual checkups ─── */}
        <TabsContent value="checkups" className="mt-4">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Annual Health Checkups</CardTitle>
                  <CardDescription>One record per academic year</CardDescription>
                </div>
                {!readOnly && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setCheckupModal({ open: true, checkup: null })}
                  >
                    <Plus className="h-4 w-4" />
                    Add Checkup
                  </Button>
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
                            {c.eyesightLeft} / {c.eyesightRight}
                          </TableCell>
                          <TableCell className="text-sm">{c.dentalHealth}</TableCell>
                          <TableCell className="text-sm">{c.bloodPressure}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[11px] whitespace-nowrap ${NUTRITION_BADGE_VARIANT[c.nutritionalStatus] || ""}`}
                            >
                              {c.nutritionalStatus}
                            </Badge>
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
                                  onClick={() => setCheckupModal({ open: true, checkup: c })}
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
          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Immunization History</CardTitle>
                  <CardDescription>All recorded vaccinations</CardDescription>
                </div>
                {!readOnly && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setImmModal({ open: true, immunization: null })}
                  >
                    <Plus className="h-4 w-4" />
                    Add Vaccination
                  </Button>
                )}
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
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-48 truncate">
                            {i.remarks || "—"}
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

        {/* ─── Observations ─── */}
        <TabsContent value="observations" className="mt-4">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Doctor &amp; Nurse Observations</CardTitle>
                  <CardDescription>
                    Clinical observations with follow-up recommendations
                  </CardDescription>
                </div>
                {!readOnly && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setObsModal({ open: true, observation: null })}
                  >
                    <Plus className="h-4 w-4" />
                    Add Observation
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {observations.length === 0 ? (
                <EmptyState text="No observations recorded yet." />
              ) : (
                <div className="max-h-96 overflow-y-auto overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-28">Academic Year</TableHead>
                        <TableHead>Observation</TableHead>
                        <TableHead>Follow-up Recommendation</TableHead>
                        {!readOnly && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {observations.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-xs font-medium whitespace-nowrap">
                            {o.academicYear}
                          </TableCell>
                          <TableCell className="text-sm whitespace-pre-wrap min-w-56">
                            {o.observation}
                          </TableCell>
                          <TableCell className="text-sm whitespace-pre-wrap min-w-56">
                            {o.recommendation}
                          </TableCell>
                          {!readOnly && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Edit observation"
                                  onClick={() => setObsModal({ open: true, observation: o })}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  aria-label="Delete observation"
                                  onClick={() =>
                                    confirmDelete(
                                      `Delete this observation from AY ${o.academicYear}?`,
                                      async () => {
                                        await api(`/api/observations/${o.id}`, {
                                          method: "DELETE",
                                        });
                                        toast.success("Observation deleted.");
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
          />
        </TabsContent>
      </Tabs>

      {/* ─── Modals ─── */}
      <StudentModal
        open={editStudentOpen}
        onOpenChange={setEditStudentOpen}
        onSaved={onChanged}
        student={student}
      />
      <CheckupModal
        open={checkupModal.open}
        onOpenChange={(open) => setCheckupModal({ open, checkup: checkupModal.checkup })}
        onSaved={onChanged}
        admissionNumber={student.admissionNumber}
        checkup={checkupModal.checkup}
        currentUser={currentUser}
      />
      <ObservationModal
        open={obsModal.open}
        onOpenChange={(open) => setObsModal({ open, observation: obsModal.observation })}
        onSaved={onChanged}
        admissionNumber={student.admissionNumber}
        observation={obsModal.observation}
      />
      <ImmunizationModal
        open={immModal.open}
        onOpenChange={(open) => setImmModal({ open, immunization: immModal.immunization })}
        onSaved={onChanged}
        admissionNumber={student.admissionNumber}
        immunization={immModal.immunization}
      />
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
    <div className="rounded-lg border bg-slate-50/60 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
