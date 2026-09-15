"use client";

import { useState, useEffect } from "react";
import {
  Droplets,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
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
import type { Student } from "@/lib/types";

const AVAILABLE_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

interface ParentBloodGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionNumber: string;
  studentName: string;
  currentBloodGroup: string;
  parentToken: string;
  onSaved: (updatedStudent: Student) => void;
}

export default function ParentBloodGroupModal({
  open,
  onOpenChange,
  admissionNumber,
  studentName,
  currentBloodGroup,
  parentToken,
  onSaved,
}: ParentBloodGroupModalProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>(
    currentBloodGroup !== "N/A" ? currentBloodGroup : "O+"
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedGroup(currentBloodGroup !== "N/A" ? currentBloodGroup : "O+");
      setSaving(false);
    }
  }, [open, currentBloodGroup]);

  async function handleSave() {
    if (!selectedGroup) {
      toast.error("Please select a blood group.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/parent/blood-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-parent-token": parentToken,
        },
        body: JSON.stringify({
          admissionNumber,
          bloodGroup: selectedGroup,
          token: parentToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update blood group.");
      }

      toast.success(
        `✓ Blood group updated to ${selectedGroup} successfully.`,
        {
          description: "The medical team and emergency records now reflect this updated blood group.",
        }
      );

      if (data.student) {
        onSaved(data.student);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update blood group.");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !saving) {
      e.preventDefault();
      handleSave();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={handleKeyDown}
        className="max-w-md p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b bg-gradient-to-r from-red-50/80 via-rose-50/50 to-white">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-9 w-9 rounded-lg bg-red-600/10 text-red-600 flex items-center justify-center">
                <Droplets className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                Update Ward&apos;s Blood Group
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600">
              Select the verified blood group for{" "}
              <span className="font-semibold text-slate-900">{studentName}</span> ({admissionNumber}).
            </DialogDescription>
          </DialogHeader>

          {/* Current Status Pill */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-slate-500">Current Blood Group on Record:</span>
            <Badge
              variant="outline"
              className={
                currentBloodGroup === "N/A"
                  ? "bg-amber-50 text-amber-800 border-amber-200 font-semibold"
                  : "bg-red-50 text-red-700 border-red-200 font-bold"
              }
            >
              {currentBloodGroup}
            </Badge>
          </div>
        </div>

        {/* Blood Group Selection Grid */}
        <div className="p-6 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2.5">
              Select Blood Group
            </Label>
            <div className="grid grid-cols-4 gap-2.5">
              {AVAILABLE_BLOOD_GROUPS.map((bg) => {
                const isSelected = selectedGroup === bg;
                return (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setSelectedGroup(bg)}
                    className={`relative flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all select-none ${
                      isSelected
                        ? "bg-red-50/90 border-red-500 text-red-700 shadow-xs ring-2 ring-red-400/40 font-bold scale-[1.02]"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-semibold"
                    }`}
                  >
                    <span className="text-base sm:text-lg">{bg}</span>
                    {isSelected && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-red-600 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border text-[11px] text-slate-600 leading-relaxed">
            <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              This update will immediately synchronize with school health records. School medical staff and emergency protocols rely on this information.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium text-slate-600">Verified Emergency Record</span>
          </div>

          <DialogFooter className="flex items-center gap-2">
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
              disabled={saving || !selectedGroup}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Confirm & Save</span>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono bg-red-700 text-red-100 rounded border border-red-500/50">
                    ↵ Enter
                  </kbd>
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
