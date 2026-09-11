"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { Student } from "@/lib/types";
import { BLOOD_GROUPS, CLASSES, GENDERS, SECTIONS } from "@/lib/constants";
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

interface StudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  student?: Student | null; // present → edit mode
}

const emptyForm = {
  admissionNumber: "",
  studentName: "",
  class: "",
  section: "",
  gender: "",
  dob: "",
  bloodGroup: "",
  parentName: "",
  phone: "",
};

export default function StudentModal({ open, onOpenChange, onSaved, student }: StudentModalProps) {
  const editing = Boolean(student);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        student
          ? {
              admissionNumber: student.admissionNumber,
              studentName: student.studentName,
              class: student.class,
              section: student.section,
              gender: student.gender,
              dob: student.dob.slice(0, 10),
              bloodGroup: student.bloodGroup,
              parentName: student.parentName,
              phone: student.phone,
            }
          : emptyForm
      );
    }
  }, [open, student]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSave() {
    const required: (keyof typeof form)[] = [
      "studentName",
      "class",
      "section",
      "gender",
      "dob",
      "bloodGroup",
      "parentName",
      "phone",
    ];
    if (!editing) required.push("admissionNumber");
    const missing = required.filter((k) => !form[k].trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      if (editing && student) {
        const { admissionNumber: _omit, ...payload } = form;
        await api(`/api/students/${encodeURIComponent(student.admissionNumber)}`, {
          method: "PUT",
          body: payload,
        });
        toast.success("Student details updated.");
      } else {
        await api("/api/students", { method: "POST", body: form });
        toast.success(`Student ${form.admissionNumber} created.`);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save student.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Student Details" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the student's basic information."
              : "Register a student to start maintaining their health record."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {!editing && (
            <div className="space-y-1.5">
              <Label htmlFor="s-adm">Admission Number *</Label>
              <Input
                id="s-adm"
                placeholder="e.g. ADM013"
                value={form.admissionNumber}
                onChange={(e) => set("admissionNumber")(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-name">Student Name *</Label>
            <Input
              id="s-name"
              value={form.studentName}
              onChange={(e) => set("studentName")(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Class *</Label>
            <Select value={form.class} onValueChange={set("class")}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((c) => (
                  <SelectItem key={c} value={c}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Section *</Label>
            <Select value={form.section} onValueChange={set("section")}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    Section {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Gender *</Label>
            <Select value={form.gender} onValueChange={set("gender")}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-dob">Date of Birth *</Label>
            <Input id="s-dob" type="date" value={form.dob} onChange={(e) => set("dob")(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Blood Group *</Label>
            <Select value={form.bloodGroup} onValueChange={set("bloodGroup")}>
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-phone">Contact Number *</Label>
            <Input
              id="s-phone"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-parent">Parent / Guardian Name *</Label>
            <Input
              id="s-parent"
              value={form.parentName}
              onChange={(e) => set("parentName")(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save Changes" : "Create Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
