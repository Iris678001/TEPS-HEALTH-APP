"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { COMMON_VACCINES, DOSE_OPTIONS } from "@/lib/constants";
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
  immunization?: Immunization | null; // present → edit
}

export default function ImmunizationModal({
  open,
  onOpenChange,
  onSaved,
  admissionNumber,
  immunization,
}: ImmunizationModalProps) {
  const editing = Boolean(immunization);
  const [saving, setSaving] = useState(false);
  const [vaccineChoice, setVaccineChoice] = useState<string>(""); // dropdown value
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
          <DialogTitle>{editing ? "Edit Vaccination" : "Add Immunization Record"}</DialogTitle>
          <DialogDescription>
            Record a vaccine dose with the next due date.
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
