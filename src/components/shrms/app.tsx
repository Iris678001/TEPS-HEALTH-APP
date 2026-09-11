"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, HeartPulse } from "lucide-react";
import { api } from "@/lib/api-client";
import type { ParentAccess, SessionUser } from "@/lib/types";
import Landing from "@/components/shrms/landing";
import DoctorLogin from "@/components/shrms/doctor-login";
import DoctorShell from "@/components/shrms/doctor-shell";
import ParentPortal from "@/components/shrms/parent-portal";

type View = "landing" | "doctor-login" | "doctor" | "parent";

export default function ShrmsApp() {
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState<View>("landing");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [parentAccess, setParentAccess] = useState<ParentAccess | null>(null);

  // Restore an existing doctor session on first load
  useEffect(() => {
    api<{ user: SessionUser | null }>("/api/auth/me")
      .then(({ user }) => {
        if (user) {
          setUser(user);
          setView("doctor");
        }
      })
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  const handleLogout = useCallback(
    async (reason?: string) => {
      try {
        await api("/api/auth/logout", { method: "POST" });
      } catch {
        // cookie may already be gone
      }
      setUser(null);
      setView("landing");
      toast.info(reason || "Signed out successfully.");
    },
    []
  );

  if (booting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <div className="flex items-center gap-2 text-primary">
          <HeartPulse className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight">SHRMS</span>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (view === "doctor") {
    if (!user) {
      setView("landing");
      return null;
    }
    return <DoctorShell user={user} onLogout={handleLogout} />;
  }

  if (view === "doctor-login") {
    return (
      <DoctorLogin
        onBack={() => setView("landing")}
        onSuccess={(u) => {
          setUser(u);
          setView("doctor");
          toast.success(`Welcome back, ${u.name}`);
        }}
      />
    );
  }

  if (view === "parent" && parentAccess) {
    return (
      <ParentPortal
        access={parentAccess}
        onExit={() => {
          setParentAccess(null);
          setView("landing");
        }}
      />
    );
  }

  return (
    <Landing
      onDoctorLogin={() => setView("doctor-login")}
      onParentVerified={(data) => {
        setParentAccess(data);
        setView("parent");
      }}
    />
  );
}
