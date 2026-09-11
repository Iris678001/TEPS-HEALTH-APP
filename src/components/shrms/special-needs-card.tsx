"use client";

import { useEffect, useState } from "react";
import {
  Wheat,
  HeartPulse,
  Accessibility,
  BookOpen,
  Pill,
  Siren,
  Pencil,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { SpecialNeed } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/helpers";

const FIELDS = [
  { key: "allergies", label: "Allergies", icon: Wheat, placeholder: "e.g. Penicillin, peanuts (severe)…" },
  { key: "chronicIllness", label: "Chronic Illness", icon: HeartPulse, placeholder: "e.g. Mild asthma…" },
  { key: "disabilities", label: "Disabilities", icon: Accessibility, placeholder: "e.g. None recorded…" },
  { key: "learningDifficulties", label: "Learning Difficulties", icon: BookOpen, placeholder: "e.g. Mild dyslexia…" },
  { key: "medication", label: "Medication", icon: Pill, placeholder: "e.g. Inhaler before sports…" },
  { key: "emergencyNotes", label: "Emergency Notes", icon: Siren, placeholder: "e.g. EpiPen kept in school office…" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

interface SpecialNeedsCardProps {
  specialNeed: SpecialNeed | null;
  admissionNumber: string;
  readOnly: boolean;
  onChanged?: () => void;
}

export default function SpecialNeedsCard({
  specialNeed,
  admissionNumber,
  readOnly,
  onChanged,
}: SpecialNeedsCardProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<FieldKey, string>>({
    allergies: "",
    chronicIllness: "",
    disabilities: "",
    learningDifficulties: "",
    medication: "",
    emergencyNotes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = {} as Record<FieldKey, string>;
    for (const { key } of FIELDS) next[key] = specialNeed?.[key] || "";
    setForm(next);
  }, [specialNeed]);

  const hasAny = FIELDS.some(({ key }) => Boolean(specialNeed?.[key]));

  async function handleSave() {
    setSaving(true);
    try {
      await api("/api/special-needs", {
        method: "PUT",
        body: { admissionNumber, ...form },
      });
      toast.success("Special needs saved.");
      setEditing(false);
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save special needs.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Special Needs</CardTitle>
            <CardDescription>
              {readOnly
                ? "Important medical considerations for this student."
                : "Allergies, conditions, medication and emergency instructions."}
            </CardDescription>
          </div>
          {!readOnly && !editing && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              {hasAny ? "Edit" : "Add"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`sn-${key}`} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </Label>
                <Textarea
                  id={`sn-${key}`}
                  rows={3}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Special Needs
              </Button>
            </div>
          </div>
        ) : hasAny ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, icon: Icon }) =>
              specialNeed?.[key] ? (
                <div key={key} className="rounded-lg border bg-slate-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {label}
                  </p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{specialNeed[key]}</p>
                </div>
              ) : null
            )}
            {specialNeed?.updatedAt && (
              <p className="sm:col-span-2 text-xs text-muted-foreground">
                Last updated {formatDateTime(specialNeed.updatedAt)}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
            <p className="text-sm font-medium">No special needs recorded</p>
            <p className="text-xs text-muted-foreground mt-1">
              {readOnly
                ? "Nothing noted for this student."
                : "Use the Add button to record allergies, conditions or medication."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
