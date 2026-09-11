"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse, ArrowLeft, LogOut, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StudentDetail from "@/components/shrms/student-detail";
import type { ParentAccess } from "@/lib/types";
import { APP_NAME } from "@/lib/constants";

interface ParentPortalProps {
  access: ParentAccess;
  onExit: () => void;
}

/**
 * Read-only parent view. Parents see the same rich record layout as doctors,
 * but without any editing controls and with a 30-minute scoped access token.
 */
export default function ParentPortal({ access, onExit }: ParentPortalProps) {
  const [exiting, setExiting] = useState(false);

  function handleExit() {
    setExiting(true);
    // give the spinner a beat so the action feels acknowledged
    setTimeout(onExit, 300);
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
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <HeartPulse className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">SHRMS</span>
        </div>
        <Badge
          variant="outline"
          className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Parent view · read-only
        </Badge>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-6xl mx-auto w-full"
        >
          <StudentDetail profile={access.profile} readOnly parentToken={access.token} />
        </motion.div>
      </main>

      <footer className="mt-auto border-t bg-white">
        <div className="h-12 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <p>{APP_NAME}</p>
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
