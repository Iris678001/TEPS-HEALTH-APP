"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { calculateBMI, getCurrentAcademicYear } from "@/lib/helpers";
import { DENTAL_HEALTH, NUTRITIONAL_STATUS } from "@/lib/constants";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CheckupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  admissionNumber: string;
  checkup?: HealthCheckup | null; // present → edit
  currentUser?: SessionUser | null;
}

export default function CheckupModal({
  open,
  onOpenChange,
  onSaved,
  admissionNumber,
  checkup,
  currentUser,
}: CheckupModalProps) {
  const editing = Boolean(checkup);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => blank(currentUser?.name));

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
      nutritionalStatus: "",
      nutritionRemarks: "",
      doctorName,
    };
  }

  useEffect(() => {
    if (open) {
      setForm(
        checkup
          ? {
              academicYear: checkup.academicYear,
              checkupDate: checkup.checkupDate.slice(0, 10),
              height: String(checkup.height),
              weight: String(checkup.weight),
              eyesightLeft: checkup.eyesightLeft,
              eyesightRight: checkup.eyesightRight,
              dentalHealth: checkup.dentalHealth,
              bloodPressure: checkup.bloodPressure,
              nutritionalStatus: checkup.nutritionalStatus,
              nutritionRemarks: checkup.nutritionRemarks || "",
              doctorName: checkup.doctorName,
            }
          : blank(currentUser?.name)
      );
    }
  }, [open, checkup, currentUser]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const bmi = useMemo(
    () => calculateBMI(Number(form.weight), Number(form.height)),
    [form.weight, form.height]
  );

  async function handleSave() {
    const required: (keyof typeof form)[] = [
      "academicYear",
      "checkupDate",
      "height",
      "weight",
      "eyesightLeft",
      "eyesightRight",
      "dentalHealth",
      "bloodPressure",
      "nutritionalStatus",
      "doctorName",
    ];
    const missing = required.filter((k) => !String(form[k]).trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    const payload = {
      ...form,
      height: Number(form.height),
      weight: Number(form.weight),
    };

    setSaving(true);
    try {
      if (editing && checkup) {
        await api(`/api/checkups/${checkup.id}`, { method: "PUT", body: payload });
        toast.success("Health checkup updated.");
      } else {
        await api("/api/checkups", {
          method: "POST",
          body: { ...payload, admissionNumber },
        });
        toast.success("Annual health checkup saved.");
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
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit Checkup · AY ${checkup?.academicYear}` : "New Annual Health Checkup"}
          </DialogTitle>
          <DialogDescription>
            BMI is calculated automatically: weight (kg) ÷ height (m)²
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-ay">Academic Year *</Label>
            <Input
              id="c-ay"
              placeholder="2025-2026"
              value={form.academicYear}
              onChange={(e) => set("academicYear")(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-date">Date of Checkup *</Label>
            <Input
              id="c-date"
              type="date"
              value={form.checkupDate}
              onChange={(e) => set("checkupDate")(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-height">Height (cm) *</Label>
            <Input
              id="c-height"
              type="number"
              min={50}
              max={250}
              step="0.1"
              placeholder="e.g. 145"
              value={form.height}
              onChange={(e) => set("height")(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-weight">Weight (kg) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="c-weight"
                type="number"
                min={2}
                max={200}
                step="0.1"
                placeholder="e.g. 36.5"
                value={form.weight}
                onChange={(e) => set("weight")(e.target.value)}
              />
              {bmi > 0 && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap"
                >
                  BMI {bmi}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-eye-l">Eyesight — Left *</Label>
            <Input
              id="c-eye-l"
              placeholder="e.g. 6/6"
              value={form.eyesightLeft}
              onChange={(e) => set("eyesightLeft")(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-eye-r">Eyesight — Right *</Label>
            <Input
              id="c-eye-r"
              placeholder="e.g. 6/6"
              value={form.eyesightRight}
              onChange={(e) => set("eyesightRight")(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Dental Health *</Label>
            <Select value={form.dentalHealth} onValueChange={set("dentalHealth")}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {DENTAL_HEALTH.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-bp">Blood Pressure *</Label>
            <Input
              id="c-bp"
              placeholder="e.g. 110/70"
              value={form.bloodPressure}
              onChange={(e) => set("bloodPressure")(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Nutritional Status *</Label>
            <Select value={form.nutritionalStatus} onValueChange={set("nutritionalStatus")}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {NUTRITIONAL_STATUS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-doctor">Doctor Name *</Label>
            <Input
              id="c-doctor"
              value={form.doctorName}
              onChange={(e) => set("doctorName")(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="c-remarks">Additional Remarks (nutrition, general)</Label>
            <Textarea
              id="c-remarks"
              rows={2}
              placeholder="Optional remarks about nutrition or general health…"
              value={form.nutritionRemarks}
              onChange={(e) => set("nutritionRemarks")(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save Changes" : "Save Checkup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
