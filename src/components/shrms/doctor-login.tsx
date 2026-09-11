"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HeartPulse, Loader2, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { SessionUser } from "@/lib/types";

interface DoctorLoginProps {
  onBack: () => void;
  onSuccess: (user: SessionUser) => void;
}

export default function DoctorLogin({ onBack, onSuccess }: DoctorLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await api<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: { username, password },
      });
      onSuccess(user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 gap-2 text-muted-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portals
          </Button>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="text-center">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-1 mx-auto">
                <HeartPulse className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">Doctor / Admin Login</CardTitle>
              <CardDescription>
                Sign in with your secure credentials to manage health records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="e.g. drmehta"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Sign in securely
                </Button>
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-800">
                  <p className="font-medium mb-0.5">Demo accounts</p>
                  <p>
                    Admin: <span className="font-mono">admin / admin123</span>
                    <span className="mx-2 text-blue-300">|</span>
                    Doctor: <span className="font-mono">drmehta / doctor123</span>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="border-t bg-white no-print">
        <div className="h-12 flex items-center justify-center text-xs text-muted-foreground px-4">
          Sessions expire automatically after 8 hours (30 min of inactivity).
        </div>
      </footer>
    </div>
  );
}
