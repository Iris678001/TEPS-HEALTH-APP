"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HeartPulse,
  LayoutDashboard,
  Users,
  History,
  LogOut,
  Menu,
  Stethoscope,
  ArrowLeft,
  UserCog,
  Smile,
  Eye,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import type { SessionUser, StudentProfile } from "@/lib/types";
import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardPage from "@/components/shrms/dashboard";
import StudentsPage from "@/components/shrms/students-page";
import StudentDetail from "@/components/shrms/student-detail";
import ActivityPage from "@/components/shrms/activity-page";
import StaffManagement from "@/components/shrms/staff-management";
import { SCHOOL_NAME, SCHOOL_LOGO } from "@/lib/constants";

type DoctorPage = "dashboard" | "students" | "activity" | "staff";

function getNavItems(role: string): { id: DoctorPage; label: string; icon: typeof LayoutDashboard }[] {
  const items: { id: DoctorPage; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: Users },
    { id: "activity", label: "Activity Log", icon: History },
  ];
  if (role === "admin") {
    items.push({ id: "staff", label: "Staff & Doctors", icon: UserCog });
  }
  return items;
}

function getRoleBadge(role: string) {
  const r = role.toLowerCase();
  if (r === "admin") {
    return {
      label: "System Admin",
      icon: ShieldCheck,
      badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
      avatarClass: "bg-amber-100 text-amber-800 border border-amber-300",
    };
  }
  if (r === "doctor_dental") {
    return {
      label: "Dental Doctor",
      icon: Smile,
      badgeClass: "bg-teal-50 text-teal-800 border-teal-300",
      avatarClass: "bg-teal-100 text-teal-800 border border-teal-300",
    };
  }
  if (r === "doctor_eye") {
    return {
      label: "Eye Doctor",
      icon: Eye,
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-300",
      avatarClass: "bg-indigo-100 text-indigo-800 border border-indigo-300",
    };
  }
  if (r === "nurse") {
    return {
      label: "School Nurse",
      icon: HeartHandshake,
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
      avatarClass: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    };
  }
  return {
    label: "General Doctor",
    icon: Stethoscope,
    badgeClass: "bg-sky-50 text-sky-800 border-sky-300",
    avatarClass: "bg-sky-100 text-sky-800 border border-sky-300",
  };
}

interface DoctorShellProps {
  user: SessionUser;
  onLogout: (reason?: string) => void | Promise<void>;
}

export default function DoctorShell({ user, onLogout }: DoctorShellProps) {
  const [page, setPage] = useState<DoctorPage>("dashboard");
  const [openAdmission, setOpenAdmission] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Automatic session timeout after 30 minutes of inactivity
  useIdleTimeout(() => {
    onLogout("Session expired after 30 minutes of inactivity. Please sign in again.");
  }, 30 * 60 * 1000, true);

  const goToPage = useCallback((p: DoctorPage) => {
    setPage(p);
    setOpenAdmission(null);
    setMobileNavOpen(false);
  }, []);

  const navItems = getNavItems(user.role);
  const activeLabel = openAdmission
    ? "Student Health Record"
    : navItems.find((n) => n.id === page)?.label || "";

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 font-sans text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-slate-200 bg-white z-30 shadow-2xs">
        <SidebarContent user={user} page={page} onNavigate={goToPage} onLogout={onLogout} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent
            user={user}
            page={page}
            onNavigate={goToPage}
            onLogout={onLogout}
          />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 border-b border-slate-200 bg-white/95 backdrop-blur flex items-center justify-between gap-3 px-4 sm:px-6 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-slate-700"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {openAdmission ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50"
                onClick={() => setOpenAdmission(null)}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Registry
              </Button>
            ) : null}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                <span>EHR Workstation</span>
                <span>/</span>
                <span className="text-slate-800 font-semibold">{activeLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-slate-700">Live Clinical Session</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-sm border-l border-slate-200 pl-3">
              {(() => {
                const badge = getRoleBadge(user.role);
                const BadgeIcon = badge.icon;
                return (
                  <>
                    <div className={`h-7 w-7 rounded ${badge.avatarClass} flex items-center justify-center shrink-0`}>
                      <BadgeIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-left leading-tight">
                      <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">@{user.username}</p>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider border rounded px-1.5 py-0.5 ml-1 ${badge.badgeClass}`}>
                      {badge.label}
                    </span>
                  </>
                );
              })()}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
              onClick={() => onLogout()}
              aria-label="Sign out"
              title="Sign out of Workstation"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6">
          <div className="max-w-6xl mx-auto w-full">
            {openAdmission ? (
              <StudentProfileLoader
                admissionNumber={openAdmission}
                currentUser={user}
                onBack={() => setOpenAdmission(null)}
                onDeleted={() => {
                  setOpenAdmission(null);
                  setPage("students");
                }}
              />
            ) : page === "dashboard" ? (
              <DashboardPage
                onOpenStudent={(adm) => setOpenAdmission(adm)}
                onGoToStudents={() => goToPage("students")}
              />
            ) : page === "students" ? (
              <StudentsPage
                onOpenStudent={(adm) => setOpenAdmission(adm)}
                currentUser={user}
              />
            ) : page === "staff" ? (
              <StaffManagement currentUser={user} />
            ) : (
              <ActivityPage />
            )}
          </div>
        </main>

        {/* Clinical footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white">
          <div className="h-11 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{SCHOOL_NAME}</span>
              <span>·</span>
              <span className="font-mono text-[11px]">CBSE HEALTH ADMINISTRATION &amp; EHR SYSTEM</span>
            </div>
            <p className="hidden sm:block font-mono text-[11px]">Clinician: {user.username} ({user.role})</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  page,
  onNavigate,
  onLogout,
}: {
  user: SessionUser;
  page: DoctorPage;
  onNavigate: (p: DoctorPage) => void;
  onLogout: (reason?: string) => void | Promise<void>;
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Institutional Clinic Header */}
      <div className="h-16 border-b border-slate-200 flex items-center gap-3 px-4 bg-slate-50/70">
        <img
          src={SCHOOL_LOGO}
          alt={SCHOOL_NAME}
          className="h-9 w-9 object-contain rounded shrink-0 bg-white p-0.5 border border-slate-200"
        />
        <div className="min-w-0">
          <p className="font-bold leading-snug tracking-tight text-xs truncate text-slate-900">
            {SCHOOL_NAME}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 leading-tight">
            Clinical Health Service
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Clinical Modules
        </p>
        {getNavItems(user.role).map(({ id, label, icon: Icon }) => {
          const isActive = page === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all text-left",
                isActive
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500")} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Clinician Active Credentials Card */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/50">
        {(() => {
          const badge = getRoleBadge(user.role);
          const BadgeIcon = badge.icon;
          return (
            <div className="rounded-md bg-white border border-slate-200 p-2.5 mb-2 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Active Station
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wider border rounded px-1.5 py-0.5 ${badge.badgeClass}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded ${badge.avatarClass} flex items-center justify-center shrink-0`}>
                  <BadgeIcon className="h-3 w-3" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">@{user.username}</p>
                </div>
              </div>
            </div>
          );
        })()}
        <Button
          variant="outline"
          className="w-full h-8 text-xs gap-2 text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 font-medium"
          onClick={() => onLogout()}
        >
          <LogOut className="h-3.5 w-3.5" />
          End Clinician Session
        </Button>
      </div>
    </div>
  );
}

/** Fetches a student profile and renders the detail view with refetch support. */
export function StudentProfileLoader({
  admissionNumber,
  currentUser,
  onBack,
  onDeleted,
}: {
  admissionNumber: string;
  currentUser: SessionUser;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    api<StudentProfile>(`/api/students/${encodeURIComponent(admissionNumber)}`)
      .then((p) => {
        if (!cancelled) {
          setProfile(p);
          setError(null);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load student.");
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [admissionNumber, refreshKey]);

  if (!loaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        {error || "Student record not found."}
      </div>
    );
  }

  return (
    <StudentDetail
      profile={profile}
      readOnly={false}
      currentUser={currentUser}
      onChanged={refetch}
      onBack={onBack}
      onDeleted={onDeleted}
    />
  );
}
