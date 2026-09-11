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
} from "lucide-react";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/helpers";
import { NUTRITION_BADGE_VARIANT } from "@/lib/constants";
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
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      tone: "bg-blue-100 text-primary",
    },
    {
      label: "Health Records",
      value: stats.totalCheckups,
      icon: ClipboardList,
      tone: "bg-emerald-100 text-emerald-600",
    },
    {
      label: `Pending ${stats.currentAcademicYear}`,
      value: stats.pendingThisYear,
      icon: Clock,
      tone: "bg-amber-100 text-amber-600",
    },
    {
      label: "Need Follow-up",
      value: stats.followUpCount,
      icon: AlertTriangle,
      tone: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="border-blue-100 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nutritional Status</CardTitle>
            <CardDescription>Latest recorded status per student</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <NutritionPie data={stats.nutritionDistribution} />
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Checkup Coverage by Class · {stats.currentAcademicYear}
            </CardTitle>
            <CardDescription>Checkups completed vs. total students per class</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CheckupsBar data={stats.checkupsByClass} />
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent checkups */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Checkups</CardTitle>
            <CardDescription>Latest annual health checkups recorded</CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="max-h-96 overflow-y-auto px-2">
              {stats.recentCheckups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No checkups recorded yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {stats.recentCheckups.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => onOpenStudent(c.admissionNumber)}
                        className="w-full flex items-center gap-3 py-2.5 px-1 rounded-lg hover:bg-blue-50 text-left transition-colors"
                      >
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                          {initialsOf(c.studentName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {c.studentName}{" "}
                            <span className="text-muted-foreground font-normal">
                              · {c.class}-{c.section}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            AY {c.academicYear} · {formatDate(c.checkupDate)} · {c.doctorName}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[11px] shrink-0 ${NUTRITION_BADGE_VARIANT[c.nutritionalStatus] || ""}`}
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
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Students Needing Follow-up</CardTitle>
                <CardDescription>
                  Abnormal findings or open doctor recommendations
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary"
                onClick={onGoToStudents}
              >
                All students
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="max-h-96 overflow-y-auto px-2">
              {stats.followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No students need follow-up right now. 🎉
                </p>
              ) : (
                <ul className="divide-y">
                  {stats.followUps.map((f) => (
                    <li key={f.admissionNumber}>
                      <button
                        onClick={() => onOpenStudent(f.admissionNumber)}
                        className="w-full flex items-start gap-3 py-2.5 px-1 rounded-lg hover:bg-blue-50 text-left transition-colors"
                      >
                        <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-semibold shrink-0">
                          {initialsOf(f.studentName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {f.studentName}{" "}
                            <span className="text-muted-foreground font-normal">
                              · {f.class}-{f.section} · {f.admissionNumber}
                            </span>
                          </p>
                          <ul className="mt-0.5 space-y-0.5">
                            {f.reasons.map((r) => (
                              <li key={r} className="text-xs text-muted-foreground flex gap-1.5">
                                <Stethoscope className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
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
