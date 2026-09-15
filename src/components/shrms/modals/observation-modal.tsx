"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { calculateAge, formatDate, getCurrentAcademicYear } from "@/lib/helpers";
import type { Observation } from "@/lib/types";
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

interface ObservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  admissionNumber: string;
  studentName?: string;
  studentDob?: string | Date;
  observation?: Observation | null; // present → edit
}

export default function ObservationModal({
  open,
  onOpenChange,
  onSaved,
  admissionNumber,
  studentName,
  studentDob,
  observation,
}: ObservationModalProps) {
  const editing = Boolean(observation);
  const [saving, setSaving] = useState(false);
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [text, setText] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const age = useMemo(() => calculateAge(studentDob), [studentDob]);

  useEffect(() => {
    if (open) {
      setAcademicYear(observation?.academicYear || getCurrentAcademicYear());
      setText(observation?.observation || "");
      setRecommendation(observation?.recommendation || "");
    }
  }, [open, observation]);

  async function handleSave() {
    if (!academicYear.trim() || text.trim().length < 3 || recommendation.trim().length < 3) {
      toast.error("Academic year, observation and recommendation are all required.");
      return;
    }
    setSaving(true);
    try {
      if (editing && observation) {
        await api(`/api/observations/${observation.id}`, {
          method: "PUT",
          body: { academicYear, observation: text, recommendation },
        });
        toast.success("Observation updated.");
      } else {
        await api("/api/observations", {
          method: "POST",
          body: { admissionNumber, academicYear, observation: text, recommendation },
        });
        toast.success("Observation added.");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save observation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle>{editing ? "Edit Observation" : "Add Clinical Observation"}</DialogTitle>
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
            <span>· Clinical observation & recommendations</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="o-ay">Academic Year *</Label>
            <Input
              id="o-ay"
              placeholder="2025-2026"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="o-text">Observation *</Label>
            <Textarea
              id="o-text"
              rows={3}
              placeholder="e.g. Recurrent cough during winter months; mild wheezing after sports."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="o-rec">Follow-up Recommendation *</Label>
            <Textarea
              id="o-rec"
              rows={3}
              placeholder="e.g. Refer to paediatrician; repeat check after 6 months."
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save Changes" : "Add Observation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
