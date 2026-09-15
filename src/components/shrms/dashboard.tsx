"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  ClipboardList,
  Clock,
  AlertTriangle,
  ArrowRight,
  Stethoscope,
  Loader2,
  CheckCircle2,
  Activity,
  FileCheck,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/helpers";
import {
  NUTRITION_BADGE_VARIANT,
  SCHOOL_NAME,
  SCHOOL_MOTTO,
  CBSE_AFFILIATION,
  SCHOOL_LOGO,
} from "@/lib/constants";
import type { DashboardStats } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { initialsOf } from "@/lib/helpers";
import NutritionPie from "@/components/charts/nutrition-pie";
import CheckupsBar from "@/components/charts/checkups-bar";

interface DashboardPageProps {
  onOpenStudent: (admissionNumber: string) => void;
  onGoToStudents: () => void;
}

export default function DashboardPage({ onOpenStudent, onGoToStudents }: DashboardPageProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<DashboardStats>("/api/dashboard")
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-md" />
          <Skeleton className="h-80 rounded-md" />
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Registered Census",
      sublabel: "Active student roster",
      value: stats.totalStudents,
      icon: Users,
      badge: "Total",
      iconClass: "text-slate-700 bg-slate-100 border-slate-200",
    },
    {
      label: "Health Records",
      sublabel: "Completed examinations",
      value: stats.totalCheckups,
      icon: FileCheck,
      badge: "Logged",
      iconClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: `Pending AY ${stats.currentAcademicYear}`,
      sublabel: "Awaiting clinical exam",
      value: stats.pendingThisYear,
      icon: Clock,
      badge: "Incomplete",
      iconClass: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      label: "Clinical Follow-ups",
      sublabel: "Active doctor referrals",
      value: stats.followUpCount,
      icon: AlertTriangle,
      badge: stats.followUpCount > 0 ? "Requires Attention" : "Clear",
      iconClass: stats.followUpCount > 0 ? "text-rose-700 bg-rose-50 border-rose-200" : "text-slate-600 bg-slate-50 border-slate-200",
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Institutional Clinical Center Header */}
      <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <img
            src={SCHOOL_LOGO}
            alt={SCHOOL_NAME}
            className="h-12 w-12 object-contain rounded shrink-0 bg-white p-1 border border-slate-200 shadow-2xs"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base text-slate-900 tracking-tight leading-tight">
                {SCHOOL_NAME}
              </h2>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider border border-slate-300 bg-slate-100 text-slate-700 rounded px-1.5 py-0.5">
                CBSE AFFILIATION #{CBSE_AFFILIATION.replace(/[^0-9]/g, "") || "930514"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Institutional Medical Records &amp; Student Health Administration · AY {stats.currentAcademicYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0 flex-wrap">
          <div className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-right">
            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Coverage Status
            </p>
            <p className="text-xs font-bold text-slate-800 font-mono">
              {stats.totalStudents > 0 ? Math.round(((stats.totalStudents - stats.pendingThisYear) / stats.totalStudents) * 100) : 0}% Screened
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-right">
            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Triage Alert Level
            </p>
            <p className="text-xs font-bold font-mono flex items-center justify-end gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${stats.followUpCount > 0 ? "bg-amber-500" : "bg-emerald-500"}`}></span>
              <span className={stats.followUpCount > 0 ? "text-amber-700" : "text-emerald-700"}>
                {stats.followUpCount > 0 ? `${stats.followUpCount} Active Flag${stats.followUpCount > 1 ? "s" : ""}` : "All Clear"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Clinical KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, sublabel, value, icon: Icon, badge, iconClass }) => (
          <Card key={label} className="border-slate-200 shadow-2xs bg-white rounded-md">
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-500 truncate">{label}</p>
                <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-1 leading-none">{value}</p>
                <p className="text-[11px] text-slate-400 mt-1 truncate">{sublabel}</p>
              </div>
              <div className={`h-9 w-9 rounded border flex items-center justify-center shrink-0 ${iconClass}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-2xs rounded-md bg-white">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                  Nutritional Epidemiology Distribution
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Current WHO/CBSE nutritional categorization across student cohort
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <NutritionPie data={stats.nutritionDistribution} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs rounded-md bg-white">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div>
              <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                Class Screening Progress · AY {stats.currentAcademicYear}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Completed examinations vs. registered cohort per academic grade
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <CheckupsBar data={stats.checkupsByClass} />
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent checkups */}
        <Card className="border-slate-200 shadow-2xs rounded-md bg-white">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                  Recent Clinical Examinations
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Latest verified health assessments filed into registry
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-slate-600 hover:text-slate-900"
                onClick={onGoToStudents}
              >
                Registry
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="max-h-96 overflow-y-auto px-2">
              {stats.recentCheckups.length === 0 ? (
                <div className="text-center py-10">
                  <ClipboardList className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-500">No examinations recorded in current session.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.recentCheckups.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => onOpenStudent(c.admissionNumber)}
                        className="w-full flex items-center gap-3 py-2.5 px-2 rounded hover:bg-slate-50 text-left transition-colors cursor-pointer"
                      >
                        <div className="h-8 w-8 rounded border border-slate-200 bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0 font-mono">
                          {initialsOf(c.studentName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {c.studentName}
                            </p>
                            <span className="font-mono text-[10px] text-slate-500">
                              #{c.admissionNumber}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 border border-slate-200 px-1 rounded bg-slate-50">
                              {c.class}-{c.section}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                            AY {c.academicYear} · {formatDate(c.checkupDate)} · {c.doctorName}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-mono font-medium rounded px-1.5 py-0.5 shrink-0 ${NUTRITION_BADGE_VARIANT[c.nutritionalStatus] || ""}`}
                        >
                          {c.nutritionalStatus}
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card className="border-slate-200 shadow-2xs rounded-md bg-white">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                  Active Clinical Flags &amp; Referrals
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Students with abnormal clinical findings or open medical notes
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-slate-600 hover:text-slate-900"
                onClick={onGoToStudents}
              >
                All Students
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="max-h-96 overflow-y-auto px-2">
              {stats.followUps.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-800">Zero Clinical Flags Pending</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                    All screened students meet baseline medical thresholds or have resolved open specialist recommendations.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.followUps.map((f) => (
                    <li key={f.admissionNumber}>
                      <button
                        onClick={() => onOpenStudent(f.admissionNumber)}
                        className="w-full flex items-start gap-3 py-2.5 px-2 rounded hover:bg-slate-50 text-left transition-colors cursor-pointer"
                      >
                        <div className="h-8 w-8 rounded border border-rose-200 bg-rose-50 text-rose-700 flex items-center justify-center text-xs font-semibold shrink-0 font-mono">
                          {initialsOf(f.studentName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-900">
                              {f.studentName}
                            </p>
                            <span className="font-mono text-[10px] text-slate-500">
                              #{f.admissionNumber}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 border border-slate-200 px-1 rounded bg-slate-50">
                              {f.class}-{f.section}
                            </span>
                          </div>
                          <ul className="mt-1 space-y-0.5">
                            {f.reasons.map((r) => (
                              <li key={r} className="text-[11px] text-rose-800 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                <span className="truncate">{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
