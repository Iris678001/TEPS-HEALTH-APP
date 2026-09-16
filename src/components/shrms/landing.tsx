"use client";

import { useState } from "react";
import { Loader2, ArrowRight, Eye, EyeOff, ShieldCheck, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import type { ParentAccess, SessionUser } from "@/lib/types";
import {
  SCHOOL_NAME,
  SCHOOL_MOTTO,
  CBSE_AFFILIATION,
  SCHOOL_LOGO,
  SCHOOL_ADDRESS,
  SCHOOL_EMAIL,
  SCHOOL_PHONE,
} from "@/lib/constants";

interface LandingProps {
  onDoctorLogin: () => void;
  onDoctorSuccess?: (user: SessionUser) => void;
  onParentVerified: (access: ParentAccess) => void;
  initialTab?: "parent" | "doctor";
}

export default function Landing({
  onDoctorLogin,
  onDoctorSuccess,
  onParentVerified,
  initialTab = "parent",
}: LandingProps) {
  const [activeTab, setActiveTab] = useState<"parent" | "doctor">(initialTab);

  // Parent form state
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [dob, setDob] = useState("");
  const [parentLoading, setParentLoading] = useState(false);

  // Doctor/Staff form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [doctorLoading, setDoctorLoading] = useState(false);

  async function handleParentVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!admissionNumber.trim() || !dob.trim()) {
      toast.error("Please provide both the student admission number and date of birth.");
      return;
    }

    let formattedDob = dob.trim();
    const datePattern = /^(\d{2})[-/.](\d{2})[-/.](\d{4})$/;
    const match = formattedDob.match(datePattern);
    
    if (match) {
      // Reformat DD-MM-YYYY to YYYY-MM-DD
      formattedDob = `${match[3]}-${match[2]}-${match[1]}`;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDob)) {
      toast.error("Please enter the Date of Birth in DD-MM-YYYY format (e.g. 25-03-2015).");
      return;
    }

    setParentLoading(true);
    try {
      const data = await api<
        ParentAccess & { profile: { student: { studentName: string } } }
      >("/api/parent/verify", {
        method: "POST",
        body: { admissionNumber: admissionNumber.trim().toUpperCase(), dob: formattedDob },
      });
      toast.success(`Verified official health records for ${data.profile.student.studentName}.`);
      onParentVerified(data as unknown as ParentAccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Record verification failed. Please verify credentials.");
    } finally {
      setParentLoading(false);
    }
  }

  async function handleDoctorSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your staff ID or username.");
      return;
    }
    if (!password) {
      toast.error("Please enter your security password.");
      return;
    }
    setDoctorLoading(true);
    try {
      const { user } = await api<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: { username: username.trim(), password },
      });
      toast.success(`Welcome, ${user.name}`);
      if (onDoctorSuccess) {
        onDoctorSuccess(user);
      } else {
        onDoctorLogin();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setDoctorLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 font-sans text-slate-800 selection:bg-amber-100 selection:text-amber-950">
      {/* ── Top Regulatory Utility Strip ───────────────────────────── */}
      <div className="bg-slate-900 text-slate-300 text-[11px] border-b border-slate-800 py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-200">
              The Elegant Public School
            </span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-400 hidden md:inline">
              {CBSE_AFFILIATION}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hidden sm:inline">Ph: 9995920120</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-amber-400 font-medium">Academic Session 2026–2027</span>
          </div>
        </div>
      </div>

      {/* ── Institutional Header & Masthead ─────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={SCHOOL_LOGO}
              alt={SCHOOL_NAME}
              className="h-13 w-13 object-contain rounded-md p-1 border border-slate-200/80 bg-white"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                  {SCHOOL_NAME}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-700 font-semibold tracking-wider uppercase mt-0.5">
                {SCHOOL_MOTTO}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight hidden sm:block mt-0.5">
                Student Health Record Management System (SHRMS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("parent")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === "parent"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Parent Portal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("doctor")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === "doctor"
                    ? "bg-slate-900 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Staff Login
              </button>
            </div>
          </div>
        </div>
        {/* Subtle Brand Accent Ribbon */}
        <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-slate-800" />
      </header>

      {/* ── Main Portal Workspace ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col justify-center">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ── Left / Center Column: Unified Access Console (7 Cols) ──── */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Console Sub-Header & Tab Selector */}
            <div className="border-b border-slate-200 bg-slate-50/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    Official Access Terminal
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                    {activeTab === "parent" ? "Student Health Card Access" : "Clinical & Staff Authentication"}
                  </h1>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>CBSE Health Compliant</span>
                </div>
              </div>

              {/* Segmented Switcher */}
              <div className="grid grid-cols-2 gap-1.5 mt-5 bg-slate-200/60 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("parent")}
                  className={`py-2 px-3 rounded-md font-medium text-center transition-all ${
                    activeTab === "parent"
                      ? "bg-white text-slate-900 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Parent & Guardian Access
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("doctor")}
                  className={`py-2 px-3 rounded-md font-medium text-center transition-all ${
                    activeTab === "doctor"
                      ? "bg-white text-slate-900 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Medical Officer & Staff
                </button>
              </div>
            </div>

            {/* ── Tab Content: Parent Access ───────────────────────── */}
            {activeTab === "parent" ? (
              <div className="p-6 sm:p-8">
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Enter your ward&apos;s institutional admission number and official date of birth as recorded in the school register to view their annual medical checkup, pediatric growth metrics, and immunization records.
                </p>

                <form onSubmit={handleParentVerify} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="admissionNumber" className="text-xs font-semibold text-slate-800">
                      Admission Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="admissionNumber"
                      placeholder="e.g. TEPS1300"
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      className="uppercase h-10 font-mono tracking-wider text-sm bg-white border-slate-300 focus-visible:border-amber-600 focus-visible:ring-amber-500/20"
                      autoComplete="off"
                    />
                    <p className="text-[11px] text-slate-500">
                      Format: Institutional ID as printed on the student identity card.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-xs font-semibold text-slate-800">
                      Student Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dob"
                      type="text"
                      placeholder="DD-MM-YYYY"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="h-10 text-sm bg-white border-slate-300 focus-visible:border-amber-600 focus-visible:ring-amber-500/20"
                    />
                    <p className="text-[11px] text-slate-500">
                      Verified date of birth matching the school admission dossier.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={parentLoading}
                      className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide uppercase shadow-xs transition-colors"
                    >
                      {parentLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Verifying Academic Record...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          View Student Health Card <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Authorized Parent View · 30-Minute Scoped Session</span>
                  <span className="text-slate-400">Read-Only Health Dossier</span>
                </div>
              </div>
            ) : (
              /* ── Tab Content: Staff / Medical Officer ────────────── */
              <div className="p-6 sm:p-8">
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Sign in with your authorized school infirmary credentials to record annual health checkups, update immunization logs, and manage special medical directives.
                </p>

                <form onSubmit={handleDoctorSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-semibold text-slate-800">
                      Staff ID or Username <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      placeholder="e.g. drmehta or admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      className="h-10 text-sm bg-white border-slate-300 focus-visible:border-amber-600 focus-visible:ring-amber-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-semibold text-slate-800">
                        Security Password <span className="text-red-500">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
                      >
                        {showPassword ? (
                          <>
                            <EyeOff className="h-3 w-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" /> Show
                          </>
                        )}
                      </button>
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter security password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="h-10 text-sm bg-white border-slate-300 focus-visible:border-amber-600 focus-visible:ring-amber-500/20"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                      />
                      <span>Maintain active session on this workstation</span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={doctorLoading}
                      className="w-full h-10 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs tracking-wide uppercase shadow-xs transition-colors"
                    >
                      {doctorLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-slate-950" /> Authenticating...
                        </span>
                      ) : (
                        "Sign In to Health Console"
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Authorized Medical Personnel Only</span>
                  <span>Session Inactivity Timeout: 30 Mins</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Official Infirmary Bulletin & Notice Board (5 Cols) ──── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Infirmary Bulletin Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Office of the School Medical Officer
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  School Health & Wellness Directives
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Statutory notices under CBSE Comprehensive Health Guidelines.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Annual Pediatric Health Screening</p>
                      <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                        Physical growth, eyesight (Snellen chart), dental hygiene, and BMI evaluations are currently underway for Classes I through XII for the 2026–27 academic session.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Mandatory Immunization Compliance</p>
                      <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                        Parents are requested to verify booster entries for Tdap, MMR, and Hepatitis B. Digital certificates can be submitted directly to the infirmary records desk.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Emergency & Allergy Protocols</p>
                      <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                        Students with documented bronchial asthma, severe food allergies, or requiring emergency medication must have updated clinical protocols on file with the school nurse.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">The Elegant Public School</p>
                <p>Market Road, Palakkad, 678014</p>
                <p>theelegantpublicschoo@gmail.com</p>
                <p>ph no. 9995920120</p>
              </div>
            </div>

            {/* Statutory Confidentiality Card */}
            <div className="bg-slate-100/70 rounded-xl border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-900">Statutory Privacy Assurance</p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                All pediatric records stored within the School Health Record Management System are strictly confidential. Data is accessible solely to verified guardians and credentialed medical practitioners in compliance with Indian educational and healthcare privacy standards.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Institutional Footer ────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-slate-700">
              © {new Date().getFullYear()} {SCHOOL_NAME}
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span>{CBSE_AFFILIATION}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>CBSE School Health Framework</span>
            <span className="text-slate-300">·</span>
            <span>{SCHOOL_ADDRESS}</span>
            <span className="text-slate-300">·</span>
            <span>theelegantpublicschoo@gmail.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

