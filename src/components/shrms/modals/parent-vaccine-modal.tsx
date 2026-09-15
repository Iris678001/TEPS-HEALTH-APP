"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Loader2,
  Plus,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  Syringe,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOSE_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/helpers";
import type { Immunization } from "@/lib/types";

// Standard pediatric immunization checklist with schedule context for CBSE schools
const STANDARD_VACCINES = [
  { name: "BCG (Tuberculosis)", age: "At Birth", priority: "primary" },
  { name: "Hepatitis B", age: "Birth, 6, 10, 14 wks", priority: "primary" },
  { name: "Polio (OPV / IPV)", age: "Birth, 6, 10, 14 wks", priority: "primary" },
  { name: "DTP / Pentavalent", age: "6, 10, 14 weeks", priority: "primary" },
  { name: "Rotavirus", age: "6, 10, 14 weeks", priority: "primary" },
  { name: "PCV (Pneumococcal)", age: "6, 14 wks & 9 mos", priority: "primary" },
  { name: "MMR (Measles, Mumps, Rubella)", age: "9 & 15 months", priority: "primary" },
  { name: "Typhoid (TCV)", age: "6-9 months & booster", priority: "recommended" },
  { name: "Hepatitis A", age: "12 months", priority: "recommended" },
  { name: "Chickenpox (Varicella)", age: "15 months", priority: "recommended" },
  { name: "DTP Booster", age: "1.5 - 2 yrs & 4 - 5 yrs", priority: "recommended" },
  { name: "Tdap / Td", age: "10 yrs & 16 yrs", priority: "booster" },
  { name: "Annual Influenza", age: "Yearly", priority: "annual" },
  { name: "HPV (Human Papillomavirus)", age: "9 - 14 yrs", priority: "adolescent" },
] as const;

interface VaccineEntryState {
  selected: boolean;
  dose: string;
  date: string;
  remarks: string;
}

interface ParentVaccineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionNumber: string;
  studentName: string;
  parentToken: string;
  existingImmunizations: Immunization[];
  onSaved: (updatedImmunizations: Immunization[]) => void;
}

export default function ParentVaccineModal({
  open,
  onOpenChange,
  admissionNumber,
  studentName,
  parentToken,
  existingImmunizations,
  onSaved,
}: ParentVaccineModalProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [saving, setSaving] = useState(false);
  const [vaccineMap, setVaccineMap] = useState<Record<string, VaccineEntryState>>({});
  const [customVaccines, setCustomVaccines] = useState<string[]>([]);
  const [newCustomName, setNewCustomName] = useState("");
  const [newCustomDate, setNewCustomDate] = useState(() => today);
  const [batchDate, setBatchDate] = useState(() => today);

  // Map of already recorded vaccines for quick lookup
  const existingMap = useMemo(() => {
    const map = new Map<string, Immunization>();
    existingImmunizations.forEach((i) => {
      map.set(i.vaccine.toLowerCase().trim(), i);
    });
    return map;
  }, [existingImmunizations]);

  // Initialize form state when dialog opens
  useEffect(() => {
    if (open) {
      const initial: Record<string, VaccineEntryState> = {};
      STANDARD_VACCINES.forEach((v) => {
        const existing = existingMap.get(v.name.toLowerCase().trim());
        initial[v.name] = {
          selected: Boolean(existing),
          dose: existing?.dose || "Completed Primary",
          date: existing ? existing.date.slice(0, 10) : today,
          remarks: existing?.remarks || "",
        };
      });
      setVaccineMap(initial);
      setCustomVaccines([]);
      setNewCustomName("");
      setNewCustomDate(today);
      setBatchDate(today);
      setSaving(false);
    }
  }, [open, existingMap, today]);

  function toggleVaccine(name: string) {
    if (existingMap.has(name.toLowerCase().trim())) return; // on record already
    setVaccineMap((prev) => {
      const current = prev[name];
      const nextSelected = !current?.selected;
      return {
        ...prev,
        [name]: {
          selected: nextSelected,
          dose: current?.dose || "Completed Primary",
          date: current?.date || today,
          remarks: current?.remarks || "",
        },
      };
    });
  }

  function updateVaccineField(name: string, field: "dose" | "date" | "remarks", val: string) {
    setVaccineMap((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        [field]: val,
      },
    }));
  }

  function selectAllRoutine() {
    setVaccineMap((prev) => {
      const updated = { ...prev };
      const routine = [
        "BCG (Tuberculosis)",
        "Hepatitis B",
        "Polio (OPV / IPV)",
        "DTP / Pentavalent",
        "Rotavirus",
        "PCV (Pneumococcal)",
        "MMR (Measles, Mumps, Rubella)",
      ];
      routine.forEach((name) => {
        if (!existingMap.has(name.toLowerCase().trim())) {
          updated[name] = {
            selected: true,
            dose: updated[name]?.dose || "Completed Primary",
            date: updated[name]?.date || today,
            remarks: updated[name]?.remarks || "",
          };
        }
      });
      return updated;
    });
    toast.info("Selected standard routine infancy vaccines.");
  }

  function applyBatchDate() {
    if (!batchDate) return;
    setVaccineMap((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (updated[key].selected && !existingMap.has(key.toLowerCase().trim())) {
          updated[key] = {
            ...updated[key],
            date: batchDate,
          };
        }
      });
      return updated;
    });
    toast.success(`Applied date ${batchDate} to all selected vaccines.`);
  }

  function addCustomVaccine() {
    const trimmed = newCustomName.trim();
    if (!trimmed) return;
    const norm = trimmed.toLowerCase();
    if (vaccineMap[trimmed] || customVaccines.some((c) => c.toLowerCase() === norm) || existingMap.has(norm)) {
      toast.error("This vaccine is already in the list or recorded.");
      return;
    }
    setCustomVaccines((prev) => [...prev, trimmed]);
    setVaccineMap((prev) => ({
      ...prev,
      [trimmed]: {
        selected: true,
        dose: "Completed Primary",
        date: newCustomDate || today,
        remarks: "",
      },
    }));
    setNewCustomName("");
    setNewCustomDate(today);
  }

  function removeCustomVaccine(name: string) {
    setCustomVaccines((prev) => prev.filter((c) => c !== name));
    setVaccineMap((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  }

  // Count newly selected vaccines that are not already recorded
  const newlySelectedCount = useMemo(() => {
    return Object.entries(vaccineMap).filter(
      ([name, state]) => state.selected && !existingMap.has(name.toLowerCase().trim())
    ).length;
  }, [vaccineMap, existingMap]);

  async function handleSave() {
    // Gather all newly selected vaccines with their individual dates
    const toSubmit = Object.entries(vaccineMap)
      .filter(([name, state]) => state.selected && !existingMap.has(name.toLowerCase().trim()))
      .map(([name, state]) => ({
        vaccine: name,
        dose: state.dose || "Completed Primary",
        date: state.date || today,
        remarks: state.remarks || undefined,
      }));

    if (toSubmit.length === 0) {
      toast.info("No new vaccines selected to save.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/parent/immunizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-parent-token": parentToken,
        },
        body: JSON.stringify({
          admissionNumber,
          token: parentToken,
          vaccines: toSubmit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save immunization records.");
      }

      toast.success(
        `✓ ${data.count} vaccination record(s) saved successfully.`,
        {
          description: "Dates and details have been saved to the official school health record.",
        }
      );

      if (data.immunizations) {
        onSaved(data.immunizations);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record vaccinations.");
    } finally {
      setSaving(false);
    }
  }

  // Global keydown: pressing Enter submits unless focused on adding a custom vaccine
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (document.activeElement?.id === "custom-vaccine-name") {
        e.preventDefault();
        addCustomVaccine();
        return;
      }
      if (saving || newlySelectedCount === 0) return;
      e.preventDefault();
      handleSave();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={handleKeyDown}
        className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-9 w-9 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <Syringe className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                Record Child Vaccinations
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-600">
              Check each vaccine <span className="font-semibold text-slate-900">{studentName}</span>{" "}
              ({admissionNumber}) has received and enter the administered date right next to it. Press{" "}
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-200 text-slate-800 rounded border">
                Enter ↵
              </kbd>{" "}
              or click below to save and update school health records.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Helper Banner */}
          <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg bg-blue-100/70 border border-blue-200/80 text-xs text-blue-950">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-700" />
            <p>
              When you check a vaccine, specify the date it was administered in the{" "}
              <strong>Date Administered</strong> column. If you don&apos;t recall the exact day, you can enter the approximate month or year, and it will be permanently saved to their health record.
            </p>
          </div>
        </div>

        {/* Toolbar: Quick Routine Selector & Optional Batch Date */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50/90 border-b flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-blue-200 hover:bg-blue-50 text-blue-700 font-medium"
              onClick={selectAllRoutine}
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Select Standard Routine Schedule
            </Button>
          </div>

          {/* Optional batch date applier */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground hidden md:inline">Quick date for all checked:</span>
            <Input
              type="date"
              value={batchDate}
              max={today}
              onChange={(e) => setBatchDate(e.target.value)}
              className="h-7 text-xs w-32 bg-white"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={applyBatchDate}
              disabled={newlySelectedCount === 0}
              className="h-7 text-xs"
            >
              Apply
            </Button>
          </div>
        </div>

        {/* Scrollable Content Body with Dedicated Table Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/80 hover:bg-slate-100/80 border-b">
                  <TableHead className="w-12 text-center">Select</TableHead>
                  <TableHead className="min-w-[180px] sm:min-w-[220px]">
                    Vaccine Name & Schedule
                  </TableHead>
                  <TableHead className="min-w-[170px]">
                    <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      Date Administered
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[140px] hidden md:table-cell">Dose</TableHead>
                  <TableHead className="min-w-[90px] text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STANDARD_VACCINES.map((v) => {
                  const existingRecord = existingMap.get(v.name.toLowerCase().trim());
                  const isAlreadyOnRecord = Boolean(existingRecord);
                  const state = vaccineMap[v.name] || {
                    selected: isAlreadyOnRecord,
                    dose: existingRecord?.dose || "Completed Primary",
                    date: existingRecord ? existingRecord.date.slice(0, 10) : today,
                    remarks: "",
                  };

                  return (
                    <TableRow
                      key={v.name}
                      onClick={() => !isAlreadyOnRecord && toggleVaccine(v.name)}
                      className={`transition-colors cursor-pointer ${
                        isAlreadyOnRecord
                          ? "bg-emerald-50/40 hover:bg-emerald-50/50 cursor-default"
                          : state.selected
                          ? "bg-blue-50/60 hover:bg-blue-50/80"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={state.selected}
                          disabled={isAlreadyOnRecord}
                          onCheckedChange={() => !isAlreadyOnRecord && toggleVaccine(v.name)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </TableCell>

                      {/* Vaccine Name & Recommended Schedule */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-semibold ${
                              state.selected ? "text-blue-950 font-bold" : "text-slate-800"
                            }`}
                          >
                            {v.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            Recommended: {v.age}
                          </span>
                        </div>
                      </TableCell>

                      {/* Date Administered Column - Right Next To Vaccine! */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {isAlreadyOnRecord ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded border border-slate-200 w-fit">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{formatDate(existingRecord?.date)}</span>
                          </div>
                        ) : state.selected ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="date"
                              value={state.date}
                              max={today}
                              onChange={(e) => updateVaccineField(v.name, "date", e.target.value)}
                              className="h-8 text-xs font-medium bg-white border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-36 sm:w-40 shadow-xs"
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => toggleVaccine(v.name)}
                            className="flex items-center gap-1.5 cursor-pointer group"
                          >
                            <Input
                              type="date"
                              value={state.date}
                              disabled
                              className="h-8 text-xs bg-slate-100/60 border-slate-200 text-slate-400 cursor-pointer w-36 sm:w-40 group-hover:border-slate-300"
                            />
                            <span className="text-[10px] text-muted-foreground hidden lg:inline group-hover:text-blue-600">
                              Click to select
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Dose Column */}
                      <TableCell
                        className="hidden md:table-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isAlreadyOnRecord ? (
                          <span className="text-xs text-slate-600">{existingRecord?.dose}</span>
                        ) : state.selected ? (
                          <Select
                            value={state.dose}
                            onValueChange={(val) => updateVaccineField(v.name, "dose", val)}
                          >
                            <SelectTrigger className="h-7 text-xs bg-white border-slate-200 w-32 sm:w-36">
                              <SelectValue placeholder="Dose" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Completed Primary" className="text-xs">
                                Completed Primary
                              </SelectItem>
                              {DOSE_OPTIONS.map((d) => (
                                <SelectItem key={d} value={d} className="text-xs">
                                  {d}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Status Column */}
                      <TableCell className="text-right">
                        {isAlreadyOnRecord ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] px-2 py-0.5 gap-1 shrink-0 font-medium"
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                            On Record
                          </Badge>
                        ) : state.selected ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-2 py-0.5 shrink-0 font-medium"
                          >
                            Selected
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Custom Vaccines entered by parent */}
                {customVaccines.map((vName) => {
                  const state = vaccineMap[vName] || {
                    selected: true,
                    dose: "Completed Primary",
                    date: today,
                    remarks: "",
                  };

                  return (
                    <TableRow key={vName} className="bg-purple-50/40 hover:bg-purple-50/60">
                      <TableCell className="text-center">
                        <Checkbox
                          checked={state.selected}
                          onCheckedChange={() => toggleVaccine(vName)}
                          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-purple-950">{vName}</span>
                          <span className="text-[11px] text-purple-700">Custom Entry</span>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="date"
                          value={state.date}
                          max={today}
                          onChange={(e) => updateVaccineField(vName, "date", e.target.value)}
                          className="h-8 text-xs font-medium bg-white border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 w-36 sm:w-40 shadow-xs"
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={state.dose}
                          onValueChange={(val) => updateVaccineField(vName, "dose", val)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-white border-purple-200 w-32 sm:w-36">
                            <SelectValue placeholder="Dose" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Completed Primary" className="text-xs">
                              Completed Primary
                            </SelectItem>
                            {DOSE_OPTIONS.map((d) => (
                              <SelectItem key={d} value={d} className="text-xs">
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeCustomVaccine(vName)}
                          aria-label="Remove custom vaccine"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Add Other / Custom Vaccine with its own Date Column */}
          <div className="p-3.5 bg-slate-50 border border-dashed rounded-lg space-y-2">
            <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-slate-500" />
              Add Any Other Vaccine Taken (Optional)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <Input
                id="custom-vaccine-name"
                placeholder="Vaccine name (e.g. Japanese Encephalitis, Cholera...)"
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                className="h-8 text-xs bg-white sm:col-span-6"
              />
              <div className="sm:col-span-4 flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden lg:inline">Date:</span>
                <Input
                  type="date"
                  value={newCustomDate}
                  max={today}
                  onChange={(e) => setNewCustomDate(e.target.value)}
                  className="h-8 text-xs bg-white w-full"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addCustomVaccine}
                disabled={!newCustomName.trim()}
                className="h-8 text-xs sm:col-span-2"
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Modal Footer with Keyboard Prompt and Save Status */}
        <div className="p-4 border-t bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              {newlySelectedCount > 0 ? (
                <>
                  Ready to record <strong className="text-slate-900">{newlySelectedCount}</strong>{" "}
                  vaccine{newlySelectedCount > 1 ? "s" : ""} with individual dates.
                </>
              ) : (
                "Select one or more vaccines to enable saving."
              )}
            </span>
          </div>

          <DialogFooter className="flex items-center gap-2 w-full sm:w-auto">
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
              disabled={saving || newlySelectedCount === 0}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Records...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Save to Record</span>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono bg-blue-700/80 text-blue-100 rounded border border-blue-500/50">
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
