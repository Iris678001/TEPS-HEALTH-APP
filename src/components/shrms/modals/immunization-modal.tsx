"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { COMMON_VACCINES, DOSE_OPTIONS } from "@/lib/constants";
import { calculateAge, formatDate } from "@/lib/helpers";
import type { Immunization } from "@/lib/types";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImmunizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  admissionNumber: string;
  studentName?: string;
  studentDob?: string | Date;
  immunization?: Immunization | null; // present → edit
}

export default function ImmunizationModal({
  open,
  onOpenChange,
  onSaved,
  admissionNumber,
  studentName,
  studentDob,
  immunization,
}: ImmunizationModalProps) {
  const editing = Boolean(immunization);
  const [saving, setSaving] = useState(false);
  const [vaccineChoice, setVaccineChoice] = useState<string>(""); // dropdown value
  const age = useMemo(() => calculateAge(studentDob), [studentDob]);
  const [customVaccine, setCustomVaccine] = useState("");
  const [date, setDate] = useState("");
  const [dose, setDose] = useState("");
  const [nextDue, setNextDue] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (open) {
      if (immunization) {
        const isCommon = (COMMON_VACCINES as readonly string[]).includes(immunization.vaccine);
        setVaccineChoice(isCommon ? immunization.vaccine : "Other");
        setCustomVaccine(isCommon ? "" : immunization.vaccine);
        setDate(immunization.date.slice(0, 10));
        setDose(immunization.dose);
        setNextDue(immunization.nextDue ? immunization.nextDue.slice(0, 10) : "");
        setRemarks(immunization.remarks || "");
      } else {
        setVaccineChoice("");
        setCustomVaccine("");
        setDate("");
        setDose("");
        setNextDue("");
        setRemarks("");
      }
    }
  }, [open, immunization]);

  const effectiveVaccine =
    vaccineChoice === "Other" ? customVaccine.trim() : vaccineChoice;

  async function handleSave() {
    if (!effectiveVaccine) {
      toast.error("Please choose a vaccine (or enter a custom one).");
      return;
    }
    if (!date || !dose) {
      toast.error("Vaccination date and dose are required.");
      return;
    }
    setSaving(true);
    try {
      if (editing && immunization) {
        await api(`/api/immunizations/${immunization.id}`, {
          method: "PUT",
          body: { vaccine: effectiveVaccine, date, dose, nextDue, remarks },
        });
        toast.success("Immunization record updated.");
      } else {
        await api("/api/immunizations", {
          method: "POST",
          body: { admissionNumber, vaccine: effectiveVaccine, date, dose, nextDue, remarks },
        });
        toast.success("Vaccination recorded.");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save immunization.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle>{editing ? "Edit Vaccination" : "Add Immunization Record"}</DialogTitle>
            {age && (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold text-xs gap-1 py-0.5 px-2.5 shadow-2xs"
              >
                <Calendar className="h-3 w-3 text-emerald-600 shrink-0" />
                <span>Age: {age.formatted}</span>
              </Badge>
            )}
          </div>
          <DialogDescription className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span>
              Student: <strong className="text-slate-800">{studentName || admissionNumber}</strong> ({admissionNumber})
            </span>
            {studentDob && <span>· DOB: {formatDate(studentDob)}</span>}
            <span>· Record pediatric dose & next due date</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Vaccine *</Label>
            <Select value={vaccineChoice} onValueChange={setVaccineChoice}>
              <SelectTrigger>
                <SelectValue placeholder="Select vaccine" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_VACCINES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vaccineChoice === "Other" && (
              <Input
                className="mt-1.5"
                placeholder="Enter custom vaccine name…"
                value={customVaccine}
                onChange={(e) => setCustomVaccine(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="i-date">Date of Vaccination *</Label>
            <Input id="i-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Dose *</Label>
            <Select value={dose} onValueChange={setDose}>
              <SelectTrigger>
                <SelectValue placeholder="Select dose" />
              </SelectTrigger>
              <SelectContent>
                {DOSE_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="i-next">Next Due Date</Label>
            <Input
              id="i-next"
              type="date"
              value={nextDue}
              onChange={(e) => setNextDue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i-remarks">Remarks</Label>
            <Input
              id="i-remarks"
              placeholder="Optional remarks…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save Changes" : "Add Vaccination"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
