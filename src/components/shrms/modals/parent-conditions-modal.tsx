"use client";

import { useState, useEffect } from "react";
import {
  HeartPulse,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  PARENT_CHRONIC_CONDITIONS,
  PARENT_CHRONIC_CONDITION_DETAILS,
  type ParentChronicCondition,
} from "@/lib/constants";
import type { SpecialNeed } from "@/lib/types";

interface ParentConditionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionNumber: string;
  studentName: string;
  parentToken: string;
  specialNeed: SpecialNeed | null;
  onSaved: (updatedSpecialNeed: SpecialNeed) => void;
}

export default function ParentConditionsModal({
  open,
  onOpenChange,
  admissionNumber,
  studentName,
  parentToken,
  specialNeed,
  onSaved,
}: ParentConditionsModalProps) {
  const [selectedConditions, setSelectedConditions] = useState<Set<ParentChronicCondition>>(
    new Set()
  );
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize or reset from existing specialNeed
  useEffect(() => {
    if (!open) return;

    const existingText = specialNeed?.chronicIllness || "";
    const activeSet = new Set<ParentChronicCondition>();

    for (const condition of PARENT_CHRONIC_CONDITIONS) {
      if (existingText.toLowerCase().includes(condition.toLowerCase())) {
        activeSet.add(condition);
      }
    }

    // Extract any existing notes: "(Notes: ...)" or "Notes: ..."
    let notes = "";
    const notesMatch = existingText.match(/(?:\(?Notes:\s*([^)]*)\)?)/i);
    if (notesMatch && notesMatch[1]) {
      notes = notesMatch[1].trim();
    }

    setSelectedConditions(activeSet);
    setAdditionalNotes(notes);
    setSaving(false);
  }, [open, specialNeed]);

  function toggleCondition(condition: ParentChronicCondition) {
    setSelectedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(condition)) {
        next.delete(condition);
      } else {
        next.add(condition);
      }
      return next;
    });
  }

  function handleClearAll() {
    setSelectedConditions(new Set());
  }

  async function handleSave() {
    setSaving(true);
    const conditionsArray = Array.from(selectedConditions);

    try {
      const res = await fetch("/api/parent/conditions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-parent-token": parentToken,
        },
        body: JSON.stringify({
          admissionNumber,
          conditions: conditionsArray,
          additionalNotes: additionalNotes.trim() || null,
          token: parentToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update health conditions.");
      }

      const count = conditionsArray.length;
      toast.success(
        count > 0
          ? `✓ Declared ${count} health condition${count > 1 ? "s" : ""} successfully.`
          : "✓ Health conditions updated (None declared).",
        {
          description:
            "School medical staff, emergency alert cards, and printable PDF cards have been updated.",
        }
      );

      if (data.specialNeed) {
        onSaved(data.specialNeed);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save health conditions.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b bg-gradient-to-r from-rose-50/80 via-amber-50/40 to-white shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-9 w-9 rounded-lg bg-rose-600/10 text-rose-600 flex items-center justify-center">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                  Declare Ward&apos;s Health Conditions
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-600 mt-0.5">
                  Check any applicable medical conditions for{" "}
                  <span className="font-semibold text-slate-900">{studentName}</span> ({admissionNumber}).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Quick Notice */}
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
            <p>
              Please declare any diagnosed conditions. This critical data informs attending school doctors, updates emergency protocols, and appears on the official Annual Health Card.
            </p>
          </div>
        </div>

        {/* Checkbox Condition List Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chronic Illness &amp; Medical Disclosures
            </Label>
            {selectedConditions.size > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <XCircle className="h-3.5 w-3.5" />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PARENT_CHRONIC_CONDITIONS.map((condName) => {
              const meta = PARENT_CHRONIC_CONDITION_DETAILS[condName];
              const isChecked = selectedConditions.has(condName);

              return (
                <div
                  key={condName}
                  onClick={() => toggleCondition(condName)}
                  className={`group relative flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? "bg-rose-50/70 border-rose-400 shadow-xs ring-1 ring-rose-400/40"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                  }`}
                >
                  <Checkbox
                    id={`cond-${condName}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleCondition(condName)}
                    className="mt-0.5 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <Label
                        htmlFor={`cond-${condName}`}
                        className="text-sm font-bold text-slate-900 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {meta.label}
                      </Label>
                      {isChecked ? (
                        <Badge
                          variant="outline"
                          className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] px-1.5 py-0 h-4 font-semibold"
                        >
                          Declared
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 font-normal text-slate-400 border-slate-200"
                        >
                          {meta.alertLevel === "critical" ? "Medical Alert" : "Special Need"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">
                      {meta.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optional Additional Care Remarks */}
          <div className="pt-2">
            <Label
              htmlFor="condition-notes"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Special Instructions, Medications, or Care Guidelines (Optional)
            </Label>
            <Textarea
              id="condition-notes"
              rows={2}
              placeholder="e.g., Prescribed anti-epileptic medication, regular hydration required, or specialist doctor contact..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="text-xs resize-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-full sm:w-auto">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium text-slate-600">Confidential Medical Record</span>
          </div>

          <DialogFooter className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Conditions...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Submit Conditions ({selectedConditions.size})</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
