"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import type { ParentAccess, SessionUser } from "@/lib/types";
import Landing from "@/components/shrms/landing";
import DoctorLogin from "@/components/shrms/doctor-login";
import DoctorShell from "@/components/shrms/doctor-shell";
import ParentPortal from "@/components/shrms/parent-portal";
import { SCHOOL_NAME, SCHOOL_LOGO, CBSE_AFFILIATION } from "@/lib/constants";

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <img
          src={SCHOOL_LOGO}
          alt={SCHOOL_NAME}
          className="h-14 w-14 object-contain rounded-xl bg-white p-2 border border-slate-200 shadow-sm"
        />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold tracking-tight text-slate-900">{SCHOOL_NAME}</p>
          <p className="text-[11px] text-slate-500">{CBSE_AFFILIATION}</p>
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-amber-600 mt-2" />
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
      onDoctorSuccess={(u) => {
        setUser(u);
        setView("doctor");
      }}
      onParentVerified={(data) => {
        setParentAccess(data);
        setView("parent");
      }}
    />
  );
}
