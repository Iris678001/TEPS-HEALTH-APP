"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Calendar,
  Stethoscope,
  Smile,
  Eye as EyeIcon,
  Ear,
  CheckCircle2,
  Clock,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import {
  calculateAge,
  calculateBMI,
  formatDate,
  getCurrentAcademicYear,
  parseStationRemarks,
  type StationRemark,
} from "@/lib/helpers";
import {
  DENTAL_HEALTH,
  ENT_EARS_OPTIONS,
  ENT_NOSE_OPTIONS,
  ENT_THROAT_OPTIONS,
  NUTRITIONAL_STATUS,
  getDoctorFieldPermissions,
} from "@/lib/constants";
import type { HealthCheckup, SessionUser } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type CheckupStation = "general" | "dental" | "eye";

interface CheckupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  admissionNumber: string;
  studentName?: string;
  studentDob?: string | Date;
  checkup?: HealthCheckup | null; // present → edit
  currentUser?: SessionUser | null;
  initialStation?: CheckupStation;
}

const VISION_OPTIONS = ["6/6", "6/9", "6/12", "6/18", "6/24", "6/36", "6/60"];

export default function CheckupModal({
  open,
  onOpenChange,
  onSaved,
  admissionNumber,
  studentName,
  studentDob,
  checkup,
  currentUser,
  initialStation = "general",
}: CheckupModalProps) {
  const editing = Boolean(checkup);
  const [saving, setSaving] = useState(false);
  const [activeStation, setActiveStation] = useState<CheckupStation>(initialStation);

  const [form, setForm] = useState(() => blank(currentUser?.name));
  const [otherStationRemarks, setOtherStationRemarks] = useState<StationRemark[]>([]);
  const age = useMemo(() => calculateAge(studentDob), [studentDob]);

  const perms = useMemo(
    () => getDoctorFieldPermissions(currentUser?.role),
    [currentUser?.role]
  );
  const userRole = (currentUser?.role || "").toLowerCase();

  function blank(doctorName = "") {
    return {
      academicYear: getCurrentAcademicYear(),
      checkupDate: new Date().toISOString().slice(0, 10),
      height: "",
      weight: "",
      eyesightLeft: "",
      eyesightRight: "",
      dentalHealth: "",
      bloodPressure: "",
      nutritionalStatus: "Normal",
      generalRemarks: "",
      dentalRemarks: "",
      eyeRemarks: "",
      entEars: "Normal",
      entNose: "Normal",
      entThroat: "Normal",
      entRemarks: "",
      doctorName,
    };
  }

  useEffect(() => {
    if (open) {
      if (initialStation) {
        setActiveStation(initialStation);
      } else if (currentUser?.role === "doctor_dental") {
        setActiveStation("dental");
      } else if (currentUser?.role === "doctor_eye") {
        setActiveStation("eye");
      } else {
        setActiveStation("general");
      }

      const parsedRemarks = parseStationRemarks(checkup?.nutritionRemarks, checkup?.entRemarks);
      const genR = parsedRemarks.find((r) => r.station === "General")?.text ||
        (parsedRemarks.length === 1 && !parsedRemarks[0].doctorName ? parsedRemarks[0].text : "");
      const dentR = parsedRemarks.find((r) => r.station === "Dental")?.text || "";
      const eyeR = parsedRemarks.find((r) => r.station === "Eye")?.text || "";
      const others = parsedRemarks.filter((r) => r.station !== "General" && r.station !== "Dental" && r.station !== "Eye" && r.station !== "ENT");

      setOtherStationRemarks(others);

      setForm(
        checkup
          ? {
              academicYear: checkup.academicYear,
              checkupDate: checkup.checkupDate.slice(0, 10),
              height: checkup.height > 0 ? String(checkup.height) : "",
              weight: checkup.weight > 0 ? String(checkup.weight) : "",
              eyesightLeft: checkup.eyesightLeft === "Pending Exam" || checkup.eyesightLeft === "Pending" ? "" : checkup.eyesightLeft,
              eyesightRight: checkup.eyesightRight === "Pending Exam" || checkup.eyesightRight === "Pending" ? "" : checkup.eyesightRight,
              dentalHealth: checkup.dentalHealth === "Pending Exam" || checkup.dentalHealth === "Pending" ? "" : (checkup.dentalHealth || ""),
              bloodPressure: checkup.bloodPressure === "Pending Exam" || checkup.bloodPressure === "Pending" ? "" : checkup.bloodPressure,
              nutritionalStatus: checkup.nutritionalStatus || "Normal",
              generalRemarks: genR,
              dentalRemarks: dentR,
              eyeRemarks: eyeR,
              entEars: checkup.entEars === "Pending Exam" ? "Normal" : (checkup.entEars || "Normal"),
              entNose: checkup.entNose === "Pending Exam" ? "Normal" : (checkup.entNose || "Normal"),
              entThroat: checkup.entThroat === "Pending Exam" ? "Normal" : (checkup.entThroat || "Normal"),
              entRemarks: checkup.entRemarks || "",
              doctorName: checkup.doctorName || currentUser?.name || "",
            }
          : blank(currentUser?.name)
      );
    }
  }, [open, checkup, currentUser, userRole, initialStation]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const bmi = useMemo(
    () => calculateBMI(Number(form.weight), Number(form.height)),
    [form.weight, form.height]
  );

  const isGeneralDone = Boolean(
    form.height &&
      Number(form.height) > 0 &&
      form.weight &&
      Number(form.weight) > 0
  );
  const isDentalDone = Boolean(
    form.dentalHealth &&
      form.dentalHealth !== "Pending Exam" &&
      form.dentalHealth !== "Pending"
  );
  const isEyeDone = Boolean(
    form.eyesightLeft &&
      form.eyesightRight &&
      form.eyesightLeft !== "Pending Exam" &&
      form.eyesightLeft !== "Pending" &&
      form.eyesightRight !== "Pending Exam" &&
      form.eyesightRight !== "Pending"
  );

  async function handleSave() {
    const required: { key: keyof typeof form; label: string }[] = [
      { key: "academicYear", label: "Academic Year" },
      { key: "checkupDate", label: "Date of Checkup" },
      { key: "doctorName", label: "Doctor Name" },
    ];

    if (activeStation === "general") {
      required.push(
        { key: "height", label: "Height (cm)" },
        { key: "weight", label: "Weight (kg)" }
      );
    } else if (activeStation === "dental") {
      required.push({ key: "dentalHealth", label: "Dental Health" });
    } else if (activeStation === "eye") {
      required.push(
        { key: "eyesightLeft", label: "Left Eyesight" },
        { key: "eyesightRight", label: "Right Eyesight" }
      );
    }

    const missing = required.filter((r) => !String(form[r.key] || "").trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }

    // Determine remarks for current active station
    let stationRemarks = "";
    if (activeStation === "dental") {
      stationRemarks = form.dentalRemarks.trim();
    } else if (activeStation === "eye") {
      stationRemarks = form.eyeRemarks.trim();
    } else {
      stationRemarks = form.generalRemarks.trim();
    }

    const stationTitle =
      activeStation === "general"
        ? "General Checkup"
        : activeStation === "dental"
        ? "Dental Checkup"
        : "Eye Checkup";

    const payload = {
      academicYear: form.academicYear,
      checkupDate: form.checkupDate,
      doctorName: form.doctorName,
      station: activeStation,
      height: form.height ? Number(form.height) : editing && checkup ? checkup.height : 0,
      weight: form.weight ? Number(form.weight) : editing && checkup ? checkup.weight : 0,
      eyesightLeft:
        activeStation === "eye"
          ? (form.eyesightLeft.trim() || "6/6")
          : (checkup?.eyesightLeft && checkup.eyesightLeft !== "Pending Exam" && checkup.eyesightLeft !== "Pending"
              ? checkup.eyesightLeft
              : (form.eyesightLeft.trim() || "Pending Exam")),
      eyesightRight:
        activeStation === "eye"
          ? (form.eyesightRight.trim() || "6/6")
          : (checkup?.eyesightRight && checkup.eyesightRight !== "Pending Exam" && checkup.eyesightRight !== "Pending"
              ? checkup.eyesightRight
              : (form.eyesightRight.trim() || "Pending Exam")),
      dentalHealth:
        activeStation === "dental"
          ? (form.dentalHealth.trim() || "Healthy")
          : (checkup?.dentalHealth && checkup.dentalHealth !== "Pending Exam" && checkup.dentalHealth !== "Pending"
              ? checkup.dentalHealth
              : (form.dentalHealth.trim() && form.dentalHealth.trim() !== "Pending Exam" ? form.dentalHealth.trim() : "Pending Exam")),
      bloodPressure:
        form.bloodPressure.trim() ||
        (editing ? checkup?.bloodPressure : "Pending Exam") ||
        "Pending Exam",
      nutritionalStatus:
        form.nutritionalStatus ||
        (editing ? checkup?.nutritionalStatus : "Normal") ||
        "Normal",
      entEars:
        form.entEars.trim() || (editing ? checkup?.entEars : "Normal") || "Normal",
      entNose:
        form.entNose.trim() || (editing ? checkup?.entNose : "Normal") || "Normal",
      entThroat:
        form.entThroat.trim() || (editing ? checkup?.entThroat : "Normal") || "Normal",
      entRemarks: form.entRemarks.trim() || null,
      nutritionRemarks: stationRemarks,
    };

    setSaving(true);
    try {
      if (editing && checkup) {
        await api(`/api/checkups/${checkup.id}`, { method: "PUT", body: payload });
        toast.success(`${stationTitle} updated successfully.`);
      } else {
        const res = await api<{ checkup: HealthCheckup; merged?: boolean }>("/api/checkups", {
          method: "POST",
          body: { ...payload, admissionNumber },
        });
        if (res.merged) {
          toast.success(`${stationTitle} merged into student's academic year record.`);
        } else {
          toast.success(`${stationTitle} recorded successfully.`);
        }
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save checkup.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div
                className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 border ${
                  activeStation === "general"
                    ? "bg-sky-50 text-sky-700 border-sky-200"
                    : activeStation === "dental"
                    ? "bg-teal-50 text-teal-700 border-teal-200"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}
              >
                {activeStation === "general" && <Stethoscope className="h-4.5 w-4.5" />}
                {activeStation === "dental" && <Smile className="h-4.5 w-4.5" />}
                {activeStation === "eye" && <EyeIcon className="h-4.5 w-4.5" />}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                  {editing
                    ? `Edit Clinical Examination · AY ${checkup?.academicYear}`
                    : "Annual Health Examination Worksheet"}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-specialty pediatric screening for school health certification
                </p>
              </div>
            </div>

            {age && (
              <span
                className="border border-emerald-300 bg-emerald-50 text-emerald-800 font-mono text-xs font-semibold px-2.5 py-1 rounded inline-flex items-center gap-1.5 shadow-2xs"
                title={`Age calculated according to Date of Birth: ${studentDob ? formatDate(studentDob) : ""}`}
              >
                <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Age: {age.formatted}</span>
                {age.months > 0 && age.years < 7 && (
                  <span className="text-[10px] text-emerald-700 font-normal">({age.exact})</span>
                )}
              </span>
            )}
          </div>

          <DialogDescription className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-mono pt-2">
            <span>
              Student: <strong className="text-slate-800 font-sans font-semibold">{studentName || admissionNumber}</strong> (#{admissionNumber})
            </span>
            {studentDob && <span>· DOB: {formatDate(studentDob)}</span>}
          </DialogDescription>
        </DialogHeader>

        {/* ─── 3 CLINICAL TABS: General Checkup, Dental Checkup, Eye Checkup ─── */}
        <div className="space-y-1">
          <p className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-400">
            Select Examination Station
          </p>
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/80 rounded-lg border border-slate-200">
            {/* Tab 1: General Checkup */}
            <button
              type="button"
              onClick={() => setActiveStation("general")}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-2 p-2.5 rounded-md text-xs font-semibold transition-all text-left ${
                activeStation === "general"
                  ? "bg-white text-sky-950 shadow-xs border border-sky-300 ring-2 ring-sky-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
              }`}
            >
              <div
                className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${
                  activeStation === "general"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-slate-200/70 text-slate-500"
                }`}
              >
                <Stethoscope className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900 leading-tight">
                  Add General Checkup
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium mt-0.5 ${
                    isGeneralDone ? "text-emerald-700" : "text-slate-600"
                  }`}
                >
                  {isGeneralDone ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" /> Vitals Entered
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-slate-600" /> Pending Vitals
                    </>
                  )}
                </span>
              </div>
            </button>

            {/* Tab 2: Dental Checkup */}
            <button
              type="button"
              onClick={() => setActiveStation("dental")}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-2 p-2.5 rounded-md text-xs font-semibold transition-all text-left ${
                activeStation === "dental"
                  ? "bg-white text-teal-950 shadow-xs border border-teal-300 ring-2 ring-teal-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
              }`}
            >
              <div
                className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${
                  activeStation === "dental"
                    ? "bg-teal-100 text-teal-700"
                    : "bg-slate-200/70 text-slate-500"
                }`}
              >
                <Smile className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900 leading-tight">
                  Add Dental Checkup
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium mt-0.5 ${
                    isDentalDone ? "text-emerald-700" : "text-slate-600"
                  }`}
                >
                  {isDentalDone ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" /> Dental Done
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-slate-600" /> Pending Dental
                    </>
                  )}
                </span>
              </div>
            </button>

            {/* Tab 3: Eye Checkup */}
            <button
              type="button"
              onClick={() => setActiveStation("eye")}
              className={`flex flex-col sm:flex-row items-center sm:items-start gap-2 p-2.5 rounded-md text-xs font-semibold transition-all text-left ${
                activeStation === "eye"
                  ? "bg-white text-indigo-950 shadow-xs border border-indigo-300 ring-2 ring-indigo-500/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
              }`}
            >
              <div
                className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${
                  activeStation === "eye"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-200/70 text-slate-500"
                }`}
              >
                <EyeIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900 leading-tight">
                  Add Eye Checkup
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium mt-0.5 ${
                    isEyeDone ? "text-emerald-700" : "text-slate-600"
                  }`}
                >
                  {isEyeDone ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" /> Vision Done
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-slate-600" /> Pending Vision
                    </>
                  )}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* ─── SHARED SESSION BAR: Academic Year, Date of Exam, Doctor Name ─── */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-md p-3 grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="c-ay" className="text-xs font-semibold text-slate-700">
              Academic Year *
            </Label>
            <Input
              id="c-ay"
              placeholder="2025-2026"
              value={form.academicYear}
              onChange={(e) => set("academicYear")(e.target.value)}
              className="font-mono text-xs h-8 bg-white border-slate-200"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-date" className="text-xs font-semibold text-slate-700">
              Date of Exam *
            </Label>
            <Input
              id="c-date"
              type="date"
              value={form.checkupDate}
              onChange={(e) => set("checkupDate")(e.target.value)}
              className="text-xs h-8 bg-white border-slate-200"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-doctor" className="text-xs font-semibold text-slate-700">
              Doctor / Clinician *
            </Label>
            <Input
              id="c-doctor"
              value={form.doctorName}
              onChange={(e) => set("doctorName")(e.target.value)}
              className="text-xs h-8 bg-white border-slate-200"
            />
          </div>
        </div>

        {/* ─── STATION-SPECIFIC VIEW ─── */}
        <div className="space-y-4">
          {/* ═══════════ STATION 1: GENERAL CHECKUP ═══════════ */}
          {activeStation === "general" && (
            <div className="space-y-4">
              <div className="p-2.5 rounded-md bg-sky-50/70 border border-sky-200 text-sky-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-sky-700 shrink-0" />
                  <div>
                    <span className="font-bold text-sky-950">General Medicine &amp; Vitals Station</span>
                    <p className="text-[11px] text-sky-800">
                      Record anthropometry, blood pressure, nutritional status, and ENT screening.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] bg-white border-sky-300 text-sky-800">
                  Station 1 / 3
                </Badge>
              </div>

              {/* Anthropometry & Vitals */}
              <div className="space-y-3 p-3 rounded-md border border-slate-200 bg-white">
                <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">
                  Anthropometry &amp; Hemodynamics
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="c-height" className="text-xs font-semibold text-slate-700">
                      Height (cm) *
                    </Label>
                    <Input
                      id="c-height"
                      type="number"
                      min={50}
                      max={250}
                      step="0.1"
                      placeholder="e.g. 142.5"
                      value={form.height}
                      onChange={(e) => set("height")(e.target.value)}
                      className="text-xs h-8 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="c-weight" className="text-xs font-semibold text-slate-700">
                      Weight (kg) *
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="c-weight"
                        type="number"
                        min={2}
                        max={200}
                        step="0.1"
                        placeholder="e.g. 34.0"
                        value={form.weight}
                        onChange={(e) => set("weight")(e.target.value)}
                        className="text-xs h-8 border-slate-200"
                      />
                      {bmi > 0 && (
                        <span className="font-mono text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-300 px-2 py-1 rounded whitespace-nowrap">
                          BMI {bmi}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="c-bp" className="text-xs font-semibold text-slate-700">
                      Blood Pressure (mmHg)
                    </Label>
                    <Input
                      id="c-bp"
                      placeholder="e.g. 110/70"
                      value={form.bloodPressure}
                      onChange={(e) => set("bloodPressure")(e.target.value)}
                      className="text-xs h-8 border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Nutritional Assessment
                    </Label>
                    <Select
                      value={form.nutritionalStatus}
                      onValueChange={set("nutritionalStatus")}
                    >
                      <SelectTrigger className="text-xs h-8 border-slate-200">
                        <SelectValue placeholder="Select nutritional status" />
                      </SelectTrigger>
                      <SelectContent>
                        {NUTRITIONAL_STATUS.map((n) => (
                          <SelectItem key={n} value={n} className="text-xs">
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ENT Screening */}
              <div className="space-y-3 p-3 rounded-md border border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Ear className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">
                      ENT (Ear, Nose &amp; Throat) Screening
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                    Clinical Otolaryngology
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Ears / Hearing</Label>
                    <Select value={form.entEars} onValueChange={set("entEars")}>
                      <SelectTrigger className="text-xs h-8 border-slate-200">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENT_EARS_OPTIONS.map((e) => (
                          <SelectItem key={e} value={e} className="text-xs">
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Nose / Airway</Label>
                    <Select value={form.entNose} onValueChange={set("entNose")}>
                      <SelectTrigger className="text-xs h-8 border-slate-200">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENT_NOSE_OPTIONS.map((n) => (
                          <SelectItem key={n} value={n} className="text-xs">
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Throat / Tonsils</Label>
                    <Select value={form.entThroat} onValueChange={set("entThroat")}>
                      <SelectTrigger className="text-xs h-8 border-slate-200">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENT_THROAT_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <Label htmlFor="c-ent-remarks" className="text-xs font-semibold text-slate-700">
                      ENT Diagnostic Notes
                    </Label>
                    <Input
                      id="c-ent-remarks"
                      placeholder="e.g. Clear external auditory canals bilaterally, no tonsillar enlargement"
                      value={form.entRemarks}
                      onChange={(e) => set("entRemarks")(e.target.value)}
                      className="text-xs h-8 border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* General Remarks */}
              <div className="space-y-2 p-3 rounded-md border border-slate-200 bg-white">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <Label htmlFor="c-gen-remarks" className="text-xs font-bold text-slate-800">
                    General Clinical Assessment &amp; Advice
                  </Label>
                  <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                    General Station Note
                  </span>
                </div>
                <Textarea
                  id="c-gen-remarks"
                  rows={3}
                  placeholder="Record overall systemic findings, posture, cardiovascular screening, developmental remarks, or pediatric recommendations..."
                  value={form.generalRemarks}
                  onChange={(e) => set("generalRemarks")(e.target.value)}
                  className="text-xs border-slate-200 resize-none"
                />
              </div>

              {/* Read-only preview of Colleague Station notes */}
              {otherStationRemarks.length > 0 && (
                <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <p className="text-[10px] font-mono uppercase font-semibold text-slate-500 tracking-wider">
                    Colleague Station Notes (Preserved)
                  </p>
                  {otherStationRemarks.map((item, idx) => (
                    <div key={idx} className="text-slate-700 leading-tight">
                      <strong className="font-semibold text-slate-900">{item.tag}</strong> {item.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ STATION 2: DENTAL CHECKUP ═══════════ */}
          {activeStation === "dental" && (
            <div className="space-y-4">
              <div className="p-2.5 rounded-md bg-teal-50/70 border border-teal-200 text-teal-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="h-4 w-4 text-teal-700 shrink-0" />
                  <div>
                    <span className="font-bold text-teal-950">Dental &amp; Oral Health Screening Station</span>
                    <p className="text-[11px] text-teal-800">
                      Screen oral hygiene, dentition condition, caries, and orthodontic alignment.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] bg-white border-teal-300 text-teal-800">
                  Station 2 / 3
                </Badge>
              </div>

              {/* Dental Health Status Selector */}
              <div className="space-y-3 p-3 rounded-md border border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800">
                    Dental Health Classification *
                  </Label>
                  {form.dentalHealth && form.dentalHealth !== "Pending Exam" && form.dentalHealth !== "Pending" ? (
                    <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      Current: {form.dentalHealth}
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Current: Pending Examination
                    </span>
                  )}
                </div>

                {/* Quick Selection Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Healthy",
                    "Needs Cavity Treatment",
                    "Gingivitis / Periodontal",
                    "Orthodontic Assessment",
                    "Dental Calculus / Cleaning",
                    "Severe Decay / Urgent",
                  ].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => set("dentalHealth")(status)}
                      className={`p-2 rounded border text-xs font-medium text-left transition-all ${
                        form.dentalHealth === status
                          ? "border-teal-600 bg-teal-50 text-teal-900 font-semibold ring-1 ring-teal-500"
                          : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{status}</span>
                        {form.dentalHealth === status && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 ml-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Label className="text-[11px] text-slate-500 font-mono">
                    Select via dropdown:
                  </Label>
                  <Select
                    value={form.dentalHealth}
                    onValueChange={set("dentalHealth")}
                  >
                    <SelectTrigger className="text-xs h-8 border-slate-200 mt-1">
                      <SelectValue placeholder="Select dental status" />
                    </SelectTrigger>
                    <SelectContent>
                      {DENTAL_HEALTH.map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dental Remarks */}
              <div className="space-y-2 p-3 rounded-md border border-slate-200 bg-white">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <Label htmlFor="c-dent-remarks" className="text-xs font-bold text-slate-800">
                    Dental Examination Remarks &amp; Treatment Advice
                  </Label>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    Dental Station Note
                  </span>
                </div>
                <Textarea
                  id="c-dent-remarks"
                  rows={3}
                  placeholder="Record tooth-specific caries, plaque accumulation, fluoride treatment, brushing technique guidance, or orthodontic referrals..."
                  value={form.dentalRemarks}
                  onChange={(e) => set("dentalRemarks")(e.target.value)}
                  className="text-xs border-slate-200 resize-none"
                />
              </div>

              {/* Vitals Summary Card for Dentist */}
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-700">Patient Vitals Context:</span>
                  <span className="font-mono text-slate-600 ml-2">
                    {form.height && form.weight
                      ? `Height ${form.height}cm · Weight ${form.weight}kg · BMI ${bmi || "N/A"}`
                      : "General vitals not yet recorded"}
                  </span>
                </div>
                {form.generalRemarks && (
                  <span className="text-[11px] text-slate-500 truncate max-w-xs" title={form.generalRemarks}>
                    General Note: {form.generalRemarks}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ STATION 3: EYE CHECKUP ═══════════ */}
          {activeStation === "eye" && (
            <div className="space-y-4">
              <div className="p-2.5 rounded-md bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeIcon className="h-4 w-4 text-indigo-700 shrink-0" />
                  <div>
                    <span className="font-bold text-indigo-950">Vision &amp; Ophthalmology Screening Station</span>
                    <p className="text-[11px] text-indigo-800">
                      Evaluate Snellen visual acuity, refractive screening, squint, and corrective lens advice.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] bg-white border-indigo-300 text-indigo-800">
                  Station 3 / 3
                </Badge>
              </div>

              {/* Visual Acuity Fields */}
              <div className="space-y-3 p-3 rounded-md border border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">
                    Bilateral Visual Acuity (Snellen Chart)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] font-mono border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                    onClick={() => {
                      set("eyesightLeft")("6/6");
                      set("eyesightRight")("6/6");
                    }}
                  >
                    Set Both 6/6 (Normal)
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Left Eye */}
                  <div className="space-y-2 p-2.5 rounded-md bg-slate-50/60 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="c-eye-l" className="text-xs font-bold text-slate-800">
                        Left Eye (O.S.) *
                      </Label>
                      <span className="font-mono text-xs font-semibold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        {form.eyesightLeft || "Not set"}
                      </span>
                    </div>
                    <Input
                      id="c-eye-l"
                      placeholder="e.g. 6/6"
                      value={form.eyesightLeft}
                      onChange={(e) => set("eyesightLeft")(e.target.value)}
                      className="text-xs h-8 bg-white border-slate-200 font-mono font-medium"
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      {VISION_OPTIONS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => set("eyesightLeft")(v)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                            form.eyesightLeft === v
                              ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Eye */}
                  <div className="space-y-2 p-2.5 rounded-md bg-slate-50/60 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="c-eye-r" className="text-xs font-bold text-slate-800">
                        Right Eye (O.D.) *
                      </Label>
                      <span className="font-mono text-xs font-semibold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        {form.eyesightRight || "Not set"}
                      </span>
                    </div>
                    <Input
                      id="c-eye-r"
                      placeholder="e.g. 6/6"
                      value={form.eyesightRight}
                      onChange={(e) => set("eyesightRight")(e.target.value)}
                      className="text-xs h-8 bg-white border-slate-200 font-mono font-medium"
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      {VISION_OPTIONS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => set("eyesightRight")(v)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                            form.eyesightRight === v
                              ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Eye Remarks */}
              <div className="space-y-2 p-3 rounded-md border border-slate-200 bg-white">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <Label htmlFor="c-eye-remarks" className="text-xs font-bold text-slate-800">
                    Ophthalmology Remarks &amp; Vision Advice
                  </Label>
                  <span className="text-[10px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Eye Station Note
                  </span>
                </div>
                <Textarea
                  id="c-eye-remarks"
                  rows={3}
                  placeholder="Record refractive error findings, squint, color vision evaluation, corrective glasses prescription, or ophthalmologist referral..."
                  value={form.eyeRemarks}
                  onChange={(e) => set("eyeRemarks")(e.target.value)}
                  className="text-xs border-slate-200 resize-none"
                />
              </div>

              {/* Clinical Context Preview */}
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-700">Dental Screening Context:</span>
                  <span className="font-mono text-slate-600 ml-2">
                    {form.dentalHealth || "Pending Exam"}
                  </span>
                </div>
                {form.generalRemarks && (
                  <span className="text-[11px] text-slate-500 truncate max-w-xs" title={form.generalRemarks}>
                    General Note: {form.generalRemarks}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── DIALOG FOOTER: Station Completion Summary & Save ─── */}
        <DialogFooter className="border-t border-slate-100 pt-3 flex items-center justify-between flex-wrap gap-2">
          {/* Station Status Pills */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span
              className={`px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                isGeneralDone
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {isGeneralDone ? <Check className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-slate-400" />}
              General: {form.height ? `${form.height}cm` : "Pending"}
            </span>

            <span
              className={`px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                isDentalDone
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {isDentalDone ? <Check className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-slate-400" />}
              Dental: {isDentalDone ? "Done" : "Pending"}
            </span>

            <span
              className={`px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                isEyeDone
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {isEyeDone ? <Check className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-slate-400" />}
              Eye: {form.eyesightLeft && form.eyesightLeft !== "Pending Exam" ? `${form.eyesightLeft}/${form.eyesightRight}` : "Pending"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="h-8 text-xs border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className={`h-8 text-xs gap-1.5 font-semibold text-white shadow-2xs ${
                activeStation === "general"
                  ? "bg-sky-700 hover:bg-sky-800"
                  : activeStation === "dental"
                  ? "bg-teal-700 hover:bg-teal-800"
                  : "bg-indigo-700 hover:bg-indigo-800"
              }`}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {activeStation === "general"
                ? "Save General Checkup"
                : activeStation === "dental"
                ? "Save Dental Checkup"
                : "Save Eye Checkup"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
