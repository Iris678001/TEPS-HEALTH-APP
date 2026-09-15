"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, Loader2, ShieldCheck, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import type { SessionUser } from "@/lib/types";
import {
  SCHOOL_NAME,
  SCHOOL_LOGO,
  CBSE_AFFILIATION,
  SCHOOL_MOTTO,
  SCHOOL_EMAIL,
  SCHOOL_PHONE,
} from "@/lib/constants";

interface DoctorLoginProps {
  onBack: () => void;
  onSuccess: (user: SessionUser) => void;
}

export default function DoctorLogin({ onBack, onSuccess }: DoctorLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your staff ID or username.");
      return;
    }
    if (!password) {
      toast.error("Please enter your security password.");
      return;
    }
    setLoading(true);
    try {
      const { user } = await api<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: { username: username.trim(), password },
      });
      toast.success(`Welcome back, ${user.name}`);
      onSuccess(user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 font-sans text-slate-800 selection:bg-amber-100 selection:text-amber-950">
      {/* ── Top Regulatory Utility Strip ───────────────────────────── */}
      <div className="bg-slate-900 text-slate-300 text-[11px] border-b border-slate-800 py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-200">The Elegant Public School</span>
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

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={SCHOOL_LOGO}
              alt={SCHOOL_NAME}
              className="h-12 w-12 object-contain rounded-md p-1 border border-slate-200/80 bg-white"
            />
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                {SCHOOL_NAME}
              </p>
              <p className="text-[11px] text-amber-700 font-semibold tracking-wider uppercase">
                {SCHOOL_MOTTO}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Public Portal
          </Button>
        </div>
        <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-slate-800" />
      </header>

      {/* ── Main Authentication Form Card ─────────────────────────── */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-10 sm:py-16 flex flex-col justify-center">
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Staff Authentication
              </span>
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Session 2026–27
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Infirmary & Clinical Console
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your clinical staff credentials to access student health records and checkup registries.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoFocus
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
                <span>Maintain session on this workstation</span>
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide uppercase shadow-xs transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying Credentials...
                  </span>
                ) : (
                  "Authenticate & Open Health Console"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Authorized Personnel Only</p>
            <p className="leading-relaxed">
              Access is restricted to school medical officers, visiting physicians, and administrators under the CBSE School Health framework.
            </p>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} {SCHOOL_NAME} · {CBSE_AFFILIATION}</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Inactivity Timeout: 30 Mins</span>
            <span className="text-slate-300">|</span>
            <span>Support: theelegantpublicschoo@gmail.com · Ph: 9995920120</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

