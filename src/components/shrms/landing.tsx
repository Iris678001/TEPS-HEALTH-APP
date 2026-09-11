"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Stethoscope,
  Users,
  ShieldCheck,
  Zap,
  Printer,
  FolderUp,
  Loader2,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import type { ParentAccess } from "@/lib/types";
import { APP_NAME } from "@/lib/constants";

interface LandingProps {
  onDoctorLogin: () => void;
  onParentVerified: (access: ParentAccess) => void;
}

export default function Landing({ onDoctorLogin, onParentVerified }: LandingProps) {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleParentVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!admissionNumber.trim() || !dob) {
      toast.error("Please enter both the admission number and date of birth.");
      return;
    }
    setLoading(true);
    try {
      const data = await api<
        ParentAccess & { profile: { student: { studentName: string } } }
      >("/api/parent/verify", {
        method: "POST",
        body: { admissionNumber: admissionNumber.trim(), dob },
      });
      toast.success(`Health record found for ${data.profile.student.studentName}.`);
      onParentVerified(data as unknown as ParentAccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold leading-tight tracking-tight">SHRMS</p>
              <p className="text-[11px] text-muted-foreground leading-tight hidden sm:block">
                School Health Record Management System
              </p>
            </div>
          </div>
          <Button onClick={onDoctorLogin} className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Doctor Login
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6 sm:pt-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge variant="outline" className="mb-4 border-blue-200 bg-blue-50 text-blue-700">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
              Annual health checkups, digitised
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 max-w-2xl mx-auto">
              Your school&apos;s health records,{" "}
              <span className="text-primary">organized and secure</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto sm:text-base text-sm">
              Maintain every student&apos;s annual checkups, growth, immunizations and doctor
              observations in one place. Parents get instant read-only access — no account needed.
            </p>
          </motion.div>
        </section>

        {/* Two portals */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 grid gap-6 md:grid-cols-2">
          {/* Parent portal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <Card className="h-full border-blue-100 shadow-sm">
              <CardHeader>
                <div className="h-11 w-11 rounded-lg bg-emerald-100 flex items-center justify-center mb-1">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle>Parent Portal</CardTitle>
                <CardDescription>
                  No account required. Enter your child&apos;s admission number and date of birth
                  to view the complete health record.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleParentVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="adm">Admission Number</Label>
                    <Input
                      id="adm"
                      placeholder="e.g. ADM001"
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      className="uppercase"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dob">Student Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    View Health Record
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Demo: admission no. <span className="font-mono font-medium">ADM001</span>, DOB{" "}
                    <span className="font-mono font-medium">2013-05-14</span>
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Doctor portal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
          >
            <Card className="h-full border-blue-100 shadow-sm">
              <CardHeader>
                <div className="h-11 w-11 rounded-lg bg-blue-100 flex items-center justify-center mb-1">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Doctor / Admin Portal</CardTitle>
                <CardDescription>
                  Secure access for school doctors and nurses to create and manage student health
                  records.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm">
                  {[
                    { icon: Zap, text: "Instant search by admission number, name, class or section" },
                    { icon: FolderUp, text: "Annual checkups, immunizations, observations & document uploads" },
                    { icon: Printer, text: "Print-ready health cards with PDF export" },
                    { icon: ShieldCheck, text: "Encrypted passwords, session timeout & full activity logs" },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-2.5">
                      <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-slate-600">{text}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" onClick={onDoctorLogin} className="w-full gap-2 border-blue-200 hover:bg-blue-50">
                  <Stethoscope className="h-4 w-4" />
                  Enter Doctor Portal
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </main>

      {/* Sticky footer */}
      <footer className="mt-auto border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-center sm:justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_NAME}</p>
          <p className="hidden sm:block">Read-only parent access · Encrypted doctor sessions</p>
        </div>
      </footer>
    </div>
  );
}
