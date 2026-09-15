"use client";

import { useState, useEffect } from "react";
import {
  IdCard,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  MapPin,
  Sparkles,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/lib/types";

interface ParentCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  parentToken: string;
  onSaved: (updatedStudent: Student) => void;
}

export default function ParentCardModal({
  open,
  onOpenChange,
  student,
  parentToken,
  onSaved,
}: ParentCardModalProps) {
  const [aadhaar, setAadhaar] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [address, setAddress] = useState("");
  const [identificationMarks, setIdentificationMarks] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize or reset form from student props
  useEffect(() => {
    if (open) {
      setAadhaar(student.aadhaarNumber || "");
      setParentName(student.parentName || "");
      setPhone(student.phone || "");
      setEmergencyContact(student.emergencyContact || "");
      setAddress(student.address || "");
      setIdentificationMarks(student.identificationMarks || "");
      setSaving(false);
    }
  }, [open, student]);

  // Format Aadhaar with 4-digit spacing as the user types
  function handleAadhaarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    let formatted = "";
    for (let i = 0; i < raw.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += raw[i];
    }
    setAadhaar(formatted);
  }

  const aadhaarDigits = aadhaar.replace(/\D/g, "");
  const isAadhaarComplete = aadhaarDigits.length === 12;

  async function handleSave() {
    if (!parentName.trim() || parentName.trim().length < 2) {
      toast.error("Please enter parent / guardian name.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter a valid primary contact number.");
      return;
    }
    if (aadhaarDigits.length > 0 && aadhaarDigits.length < 12) {
      toast.error("Aadhaar Card number must be exactly 12 digits (or leave blank).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/parent/card-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-parent-token": parentToken,
        },
        body: JSON.stringify({
          admissionNumber: student.admissionNumber,
          aadhaarNumber: aadhaar.trim() || null,
          parentName: parentName.trim(),
          phone: phone.trim(),
          emergencyContact: emergencyContact.trim() || null,
          address: address.trim() || null,
          identificationMarks: identificationMarks.trim() || null,
          token: parentToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update card details.");
      }

      toast.success("✓ Student card details updated successfully.", {
        description:
          "Official health card, printable PDF preview, and clinic emergency contacts updated.",
      });

      if (data.student) {
        onSaved(data.student);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update card details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-9 w-9 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <IdCard className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                  Update Ward&apos;s Card &amp; Identity Details
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-600 mt-0.5">
                  Update official card details for{" "}
                  <span className="font-semibold text-slate-900">{student.studentName}</span> (
                  {student.admissionNumber}).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/80 border border-blue-200/70 text-[11px] text-blue-900 leading-relaxed">
            <AlertCircle className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Information entered here updates the official CBSE Annual Health Record Card and printable PDF card.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Aadhaar Card Number */}
          <div className="space-y-1.5 p-3 rounded-xl border border-blue-200 bg-blue-50/40">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="aadhaar-input"
                className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
              >
                <IdCard className="h-4 w-4 text-blue-600" />
                Aadhaar Card Number (12-Digit UID)
              </Label>
              {isAadhaarComplete ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] gap-1 font-semibold"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  12 Digits Verified
                </Badge>
              ) : (
                <span className="text-[11px] text-slate-500">
                  {aadhaarDigits.length}/12 digits
                </span>
              )}
            </div>
            <Input
              id="aadhaar-input"
              value={aadhaar}
              onChange={handleAadhaarChange}
              placeholder="e.g. 5482 1928 3041"
              maxLength={14}
              className="font-mono text-sm tracking-widest bg-white border-blue-200"
            />
            <p className="text-[11px] text-slate-500">
              Enter the 12 digits as printed on your child&apos;s physical Aadhaar card.
            </p>
          </div>

          {/* Identification Marks */}
          <div className="space-y-1.5">
            <Label
              htmlFor="marks-input"
              className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Identification Marks (CBSE Health Identity)
            </Label>
            <Input
              id="marks-input"
              value={identificationMarks}
              onChange={(e) => setIdentificationMarks(e.target.value)}
              placeholder="e.g. A mole on the left cheek, small scar on right wrist..."
              className="text-xs"
            />
            <p className="text-[11px] text-slate-500">
              Visible bodily marks used for official student health identification.
            </p>
          </div>

          {/* Parent Name & Primary Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="parent-name-input"
                className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <User className="h-3.5 w-3.5 text-slate-500" />
                Parent / Guardian Full Name
              </Label>
              <Input
                id="parent-name-input"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Full name of parent or legal guardian"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="phone-input"
                className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                Primary Contact Number
              </Label>
              <Input
                id="phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="text-xs"
              />
            </div>
          </div>

          {/* Emergency / Alternate Contact */}
          <div className="space-y-1.5">
            <Label
              htmlFor="emergency-contact-input"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Phone className="h-3.5 w-3.5 text-rose-500" />
              Emergency / Alternate Contact Number (Optional)
            </Label>
            <Input
              id="emergency-contact-input"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="e.g. 9847123456 (Mother's Phone / Relative)"
              className="text-xs"
            />
          </div>

          {/* Residential Address */}
          <div className="space-y-1.5">
            <Label
              htmlFor="address-input"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              Residential Address
            </Label>
            <Textarea
              id="address-input"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Door No., Street/Area, Post Office, City, Pincode..."
              className="text-xs resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-full sm:w-auto">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium text-slate-600">Official CBSE Student Record</span>
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
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Details...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Save Card Details</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
