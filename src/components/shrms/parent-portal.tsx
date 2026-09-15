"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  HeartPulse,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Loader2,
  Syringe,
  Droplets,
  AlertTriangle,
  IdCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StudentDetail from "@/components/shrms/student-detail";
import ParentVaccineModal from "@/components/shrms/modals/parent-vaccine-modal";
import ParentBloodGroupModal from "@/components/shrms/modals/parent-blood-group-modal";
import ParentConditionsModal from "@/components/shrms/modals/parent-conditions-modal";
import ParentCardModal from "@/components/shrms/modals/parent-card-modal";
import type { Attachment, Immunization, ParentAccess, SpecialNeed, Student, StudentProfile } from "@/lib/types";
import {
  SCHOOL_NAME,
  SCHOOL_LOGO,
  CBSE_AFFILIATION,
  PARENT_CHRONIC_CONDITIONS,
  PARENT_CHRONIC_CONDITION_DETAILS,
} from "@/lib/constants";

interface ParentPortalProps {
  access: ParentAccess;
  onExit: () => void;
}

/**
 * Parent portal view. Parents can view their ward's comprehensive health records,
 * record early childhood vaccinations, and update verified blood groups and card details.
 */
export default function ParentPortal({ access, onExit }: ParentPortalProps) {
  const [exiting, setExiting] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>(access.profile);
  const [vaccineModalOpen, setVaccineModalOpen] = useState(false);
  const [bloodGroupModalOpen, setBloodGroupModalOpen] = useState(false);
  const [conditionsModalOpen, setConditionsModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);

  function handleExit() {
    setExiting(true);
    // give the spinner a beat so the action feels acknowledged
    setTimeout(onExit, 300);
  }

  function handleVaccinesUpdated(updatedImmunizations: Immunization[]) {
    setProfile((prev) => ({
      ...prev,
      immunizations: updatedImmunizations,
    }));
  }

  function handleStudentUpdated(updatedStudent: Student) {
    setProfile((prev) => ({
      ...prev,
      student: { ...prev.student, ...updatedStudent },
    }));
  }

  function handleSpecialNeedUpdated(updatedSpecialNeed: SpecialNeed) {
    setProfile((prev) => ({
      ...prev,
      specialNeed: updatedSpecialNeed,
    }));
  }

  const declaredConditions = useMemo(() => {
    const text = profile.specialNeed?.chronicIllness || "";
    return PARENT_CHRONIC_CONDITIONS.filter((c) =>
      text.toLowerCase().includes(c.toLowerCase())
    );
  }, [profile.specialNeed?.chronicIllness]);

  function handleAttachmentsUpdated(updatedAttachments: Attachment[]) {
    setProfile((prev) => ({
      ...prev,
      attachments: updatedAttachments,
    }));
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-20 h-14 border-b bg-white/95 backdrop-blur flex items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-1 text-muted-foreground"
          onClick={handleExit}
          disabled={exiting}
        >
          {exiting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
          Exit
        </Button>
        <div className="flex items-center gap-2.5">
          <img
            src={SCHOOL_LOGO}
            alt={SCHOOL_NAME}
            className="h-8 w-8 object-contain rounded shrink-0"
          />
          <span className="font-bold text-sm tracking-tight text-slate-900 hidden sm:inline">
            {SCHOOL_NAME}
          </span>
          <span className="font-bold text-sm tracking-tight text-slate-900 sm:hidden">
            Parent Portal
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setBloodGroupModalOpen(true)}
            className="h-8 gap-1.5 border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 text-xs font-semibold shadow-xs"
          >
            <Droplets className="h-3.5 w-3.5 text-red-500" />
            <span className="hidden sm:inline">Blood Group:</span> {profile.student.bloodGroup}
          </Button>

          <Button
            size="sm"
            onClick={() => setVaccineModalOpen(true)}
            className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
          >
            <Syringe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Declare</span> Vaccinations
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setConditionsModalOpen(true)}
            className="h-8 gap-1.5 border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-xs"
          >
            <HeartPulse className="h-3.5 w-3.5 text-rose-600" />
            <span className="hidden sm:inline">Health</span> Conditions
            {declaredConditions.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold leading-none">
                {declaredConditions.length}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCardModalOpen(true)}
            className="h-8 gap-1.5 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold shadow-xs"
          >
            <IdCard className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Card</span> Details
            {profile.student.aadhaarNumber && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold leading-none">
                ✓
              </span>
            )}
          </Button>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 hidden sm:flex"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Parent
          </Badge>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-6xl mx-auto w-full"
        >
          {/* Blood group not set warning banner */}
          {profile.student.bloodGroup === "N/A" && (
            <div className="mb-4 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 sm:p-4 text-amber-950 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
                  <Droplets className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                    Ward&apos;s Blood Group Not Yet Recorded
                  </h4>
                  <p className="text-xs text-amber-800/90 mt-0.5">
                    Please submit your child&apos;s blood group so emergency medical profiles and health identity cards are complete.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setBloodGroupModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8 px-3.5 shrink-0 shadow-xs gap-1.5"
              >
                <Droplets className="h-3.5 w-3.5" />
                Set Blood Group
              </Button>
            </div>
          )}

          {/* Parent Vaccination Declaration Callout Banner */}
          <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase">
                  Parent Action
                </span>
                <h2 className="text-base sm:text-lg font-bold">
                  Declare Ward&apos;s Childhood Vaccinations
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
                School doctors do not have past records of vaccines received outside school. Select your child&apos;s vaccines and save to update their official school health record.
              </p>
            </div>
            <Button
              onClick={() => setVaccineModalOpen(true)}
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs sm:text-sm h-9 sm:h-10 px-4 shrink-0 shadow-xs gap-2"
            >
              <Syringe className="h-4 w-4 text-blue-600" />
              Declare Vaccinations
            </Button>
          </div>

          {/* Parent Chronic Health Conditions Disclosure Callout Banner */}
          {declaredConditions.length > 0 ? (
            <div className="mb-6 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50/90 via-amber-50/40 to-white p-4 sm:p-5 text-slate-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold tracking-wider uppercase">
                    Medical Alert Active
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-rose-950">
                    Declared Health Conditions ({declaredConditions.length})
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  The following medical conditions are on record and shared with the school medical team, emergency responders, and official health card:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {declaredConditions.map((cond) => {
                    const meta = PARENT_CHRONIC_CONDITION_DETAILS[cond];
                    return (
                      <Badge
                        key={cond}
                        variant="outline"
                        className={`text-xs px-2.5 py-0.5 font-semibold ${meta.badgeClass}`}
                      >
                        {cond}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <Button
                onClick={() => setConditionsModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm h-9 sm:h-10 px-4 shrink-0 shadow-xs gap-2"
              >
                <HeartPulse className="h-4 w-4" />
                Update Conditions
              </Button>
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-rose-200/80 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase">
                    Health Disclosure
                  </span>
                  <h2 className="text-base sm:text-lg font-bold">
                    Declare Ward&apos;s Medical Conditions
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-rose-100 max-w-2xl leading-relaxed">
                  Declare any chronic conditions (Mental Illness, Epilepsy, Depression, Chronic Nephritis, Uremia, Infectious Disease) so school doctors and emergency responders are prepared.
                </p>
              </div>
              <Button
                onClick={() => setConditionsModalOpen(true)}
                className="bg-white text-rose-700 hover:bg-rose-50 font-semibold text-xs sm:text-sm h-9 sm:h-10 px-4 shrink-0 shadow-xs gap-2"
              >
                <HeartPulse className="h-4 w-4 text-rose-600" />
                Declare Conditions
              </Button>
            </div>
          )}

          {/* Identity & Aadhaar Card Details Callout Banner */}
          {!profile.student.aadhaarNumber ? (
            <div className="mb-6 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-sky-50/50 to-white p-4 sm:p-5 text-slate-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold tracking-wider uppercase">
                    Identity Verification
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-indigo-950">
                    Aadhaar &amp; Card Details Required
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Provide your child&apos;s 12-digit Aadhaar UID number, emergency contact phone, residential address, and visible identification marks to complete the CBSE Student Annual Health Card and official records.
                </p>
              </div>
              <Button
                onClick={() => setCardModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm h-9 sm:h-10 px-4 shrink-0 shadow-xs gap-2"
              >
                <IdCard className="h-4 w-4" />
                Enter Card Details
              </Button>
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-indigo-100 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <IdCard className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      Aadhaar &amp; Identification Card Details
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 py-0 font-medium">
                      On Record
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    UID: <span className="font-mono font-medium text-slate-700">{profile.student.aadhaarNumber}</span>
                    {profile.student.identificationMarks ? ` · Marks: ${profile.student.identificationMarks}` : ""}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCardModalOpen(true)}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold h-8 gap-1.5"
              >
                <IdCard className="h-3.5 w-3.5" />
                Edit Details
              </Button>
            </div>
          )}

          <StudentDetail
            profile={profile}
            readOnly
            parentToken={access.token}
            onVaccinesUpdated={handleVaccinesUpdated}
            onStudentUpdated={handleStudentUpdated}
            onSpecialNeedUpdated={handleSpecialNeedUpdated}
            onAttachmentsUpdated={handleAttachmentsUpdated}
          />
        </motion.div>
      </main>

      <ParentVaccineModal
        open={vaccineModalOpen}
        onOpenChange={setVaccineModalOpen}
        admissionNumber={profile.student.admissionNumber}
        studentName={profile.student.studentName}
        parentToken={access.token}
        existingImmunizations={profile.immunizations}
        onSaved={handleVaccinesUpdated}
      />

      <ParentBloodGroupModal
        open={bloodGroupModalOpen}
        onOpenChange={setBloodGroupModalOpen}
        admissionNumber={profile.student.admissionNumber}
        studentName={profile.student.studentName}
        currentBloodGroup={profile.student.bloodGroup}
        parentToken={access.token}
        onSaved={handleStudentUpdated}
      />

      <ParentConditionsModal
        open={conditionsModalOpen}
        onOpenChange={setConditionsModalOpen}
        admissionNumber={profile.student.admissionNumber}
        studentName={profile.student.studentName}
        parentToken={access.token}
        specialNeed={profile.specialNeed}
        onSaved={handleSpecialNeedUpdated}
      />

      <ParentCardModal
        open={cardModalOpen}
        onOpenChange={setCardModalOpen}
        student={profile.student}
        parentToken={access.token}
        onSaved={handleStudentUpdated}
      />

      <footer className="mt-auto border-t bg-white">
        <div className="h-12 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <p>{SCHOOL_NAME} · {CBSE_AFFILIATION}</p>
          <p className="hidden sm:flex items-center gap-1.5">
            <LogOut className="h-3 w-3" />
            Access expires automatically after 30 minutes
          </p>
        </div>
      </footer>
    </div>
  );
}

// Loading fallback reused by app shell if needed
export function ParentPortalSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
