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

type DoctorPage = "dashboard" | "students" | "activity";

const NAV: { id: DoctorPage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: Users },
  { id: "activity", label: "Activity Log", icon: History },
];

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

  const activeLabel = openAdmission
    ? "Student Profile"
    : NAV.find((n) => n.id === page)?.label || "";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r bg-white z-30">
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
        <header className="sticky top-0 z-20 h-14 border-b bg-white/95 backdrop-blur flex items-center gap-3 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {openAdmission ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-1 text-muted-foreground"
              onClick={() => setOpenAdmission(null)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : null}
          <h1 className="font-semibold tracking-tight">{activeLabel}</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Stethoscope className="h-4 w-4" />
              </div>
              <span className="font-medium">{user.name}</span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground border rounded px-1.5 py-0.5">
                {user.role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onLogout()}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4.5 w-4.5" />
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
              <StudentsPage onOpenStudent={(adm) => setOpenAdmission(adm)} />
            ) : (
              <ActivityPage />
            )}
          </div>
        </main>

        {/* Sticky footer */}
        <footer className="mt-auto border-t bg-white">
          <div className="h-12 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
            <p>School Health Record Management System</p>
            <p className="hidden sm:block">Signed in as {user.username}</p>
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
    <div className="flex flex-col h-full">
      <div className="h-14 border-b flex items-center gap-2.5 px-4">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <HeartPulse className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <p className="font-bold leading-tight tracking-tight text-sm">SHRMS</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Doctor Portal</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={page === id ? "page" : undefined}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              page === id
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:bg-blue-50 hover:text-primary"
            )}
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="rounded-lg bg-slate-50 px-3 py-2.5 mb-2">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role} account</p>
        </div>
        <Button
          variant="outline"
          className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={() => onLogout()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
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
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
        {error || "Student not found."}
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
