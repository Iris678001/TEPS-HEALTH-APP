"use client";

import { useEffect, useMemo, useState } from "react";
import {
  UserPlus,
  Trash2,
  KeyRound,
  ShieldCheck,
  Stethoscope,
  HeartHandshake,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  Smile,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { DoctorStaff, SessionUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface StaffManagementProps {
  currentUser: SessionUser;
}

export default function StaffManagement({ currentUser }: StaffManagementProps) {
  const [staffList, setStaffList] = useState<DoctorStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Add Dialog State
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [addRole, setAddRole] = useState("doctor_general");
  const [addPassword, setAddPassword] = useState("");
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Staff State
  const [editTarget, setEditTarget] = useState<DoctorStaff | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("doctor_general");
  const [isEditing, setIsEditing] = useState(false);

  // Reset Password Dialog State
  const [resetTarget, setResetTarget] = useState<DoctorStaff | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<DoctorStaff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch staff list
  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await api<{ data: DoctorStaff[] }>("/api/doctors");
      setStaffList(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load staff list";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.username.toLowerCase().includes(search.toLowerCase());
      let matchesRole = true;
      if (roleFilter !== "all") {
        if (roleFilter === "doctor_general") {
          matchesRole = s.role === "doctor_general" || s.role === "doctor";
        } else {
          matchesRole = s.role === roleFilter;
        }
      }
      return matchesSearch && matchesRole;
    });
  }, [staffList, search, roleFilter]);

  // Role Counts
  const counts = useMemo(() => {
    const total = staffList.length;
    const generalDoctors = staffList.filter((s) => s.role === "doctor_general" || s.role === "doctor").length;
    const dentalDoctors = staffList.filter((s) => s.role === "doctor_dental").length;
    const eyeDoctors = staffList.filter((s) => s.role === "doctor_eye").length;
    const nurses = staffList.filter((s) => s.role === "nurse").length;
    const admins = staffList.filter((s) => s.role === "admin").length;
    return { total, generalDoctors, dentalDoctors, eyeDoctors, nurses, admins };
  }, [staffList]);

  // Handle Add Staff
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addUsername.trim() || !addPassword.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (addPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api<{ success: boolean; doctor: DoctorStaff }>("/api/doctors", {
        method: "POST",
        body: {
          name: addName.trim(),
          username: addUsername.trim().toLowerCase(),
          role: addRole,
          password: addPassword.trim(),
        },
      });
      toast.success(`Account for ${res.doctor.name} (@${res.doctor.username}) created successfully!`);
      setAddOpen(false);
      setAddName("");
      setAddUsername("");
      setAddPassword("");
      setAddRole("doctor_general");
      loadStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Staff (Name & Role)
  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editName.trim()) {
      toast.error("Please enter a valid staff name.");
      return;
    }

    setIsEditing(true);
    try {
      await api(`/api/doctors/${editTarget.id}`, {
        method: "PATCH",
        body: {
          name: editName.trim(),
          role: editRole,
        },
      });
      toast.success(`Staff account for @${editTarget.username} updated.`);
      setEditTarget(null);
      loadStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update staff member";
      toast.error(msg);
    } finally {
      setIsEditing(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setIsResetting(true);
    try {
      await api(`/api/doctors/${resetTarget.id}`, {
        method: "PATCH",
        body: { password: newPassword.trim() },
      });
      toast.success(`Password for @${resetTarget.username} has been updated.`);
      setResetTarget(null);
      setNewPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password";
      toast.error(msg);
    } finally {
      setIsResetting(false);
    }
  };

  // Handle Delete Staff
  const handleDeleteStaff = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await api<{ success: boolean; message: string }>(
        `/api/doctors/${deleteTarget.id}`,
        { method: "DELETE" }
      );
      toast.success(res.message);
      setDeleteTarget(null);
      loadStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Medical & Clinical Staff Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authorize and manage school doctors, specialist physicians (General, Dental, Eye), and nurses with partitioned clinical access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStaff}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            size="sm"
            className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            <UserPlus className="h-4 w-4" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Specialty Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-sans">
        <div className="bg-white border border-slate-200 rounded-md p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">Total Staff</span>
            <UserCheck className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">{counts.total}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">General</span>
            <Stethoscope className="h-4 w-4 text-sky-600" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">{counts.generalDoctors}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">Dental</span>
            <Smile className="h-4 w-4 text-teal-600" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">{counts.dentalDoctors}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">Eye / Vision</span>
            <Eye className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">{counts.eyeDoctors}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">Nurses</span>
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">{counts.nurses}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">Admins</span>
            <ShieldCheck className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">{counts.admins}</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap font-mono font-medium">Specialty:</span>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 text-xs w-48 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Staff Accounts</SelectItem>
              <SelectItem value="doctor_general" className="text-xs">General Physicians</SelectItem>
              <SelectItem value="doctor_dental" className="text-xs">Dental Doctors</SelectItem>
              <SelectItem value="doctor_eye" className="text-xs">Ophthalmologists / Eye</SelectItem>
              <SelectItem value="nurse" className="text-xs">School Nurses</SelectItem>
              <SelectItem value="admin" className="text-xs">System Administrators</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-base">No staff accounts found</p>
            <p className="text-slate-400 text-xs mt-1">
              Try adjusting your search query or add a new medical officer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-mono font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Clinician / Staff Member</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Specialty &amp; Privilege</th>
                  <th className="py-3 px-4">Commissioned</th>
                  <th className="py-3 px-4 text-right">Station Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => {
                  const isCurrent = staff.username === currentUser.username;
                  const isPrimaryAdmin = staff.username === "admin";

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs font-mono shrink-0">
                            {staff.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                              {staff.name}
                              {isCurrent && (
                                <span className="text-[9px] font-mono uppercase font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2 rounded">
                                  Current User
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">Station ID #{staff.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        <div className="space-y-1">
                          <div>@{staff.username}</div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded font-sans font-medium">
                            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                            Active Password
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {staff.role === "admin" ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 gap-1 text-[10px] font-mono font-semibold uppercase rounded px-1.5 py-0.5">
                            <ShieldCheck className="h-3 w-3" /> System Admin
                          </Badge>
                        ) : staff.role === "doctor_dental" ? (
                          <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-300 gap-1 text-[10px] font-mono font-semibold uppercase rounded px-1.5 py-0.5">
                            <Smile className="h-3 w-3" /> Dental Doctor
                          </Badge>
                        ) : staff.role === "doctor_eye" ? (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-300 gap-1 text-[10px] font-mono font-semibold uppercase rounded px-1.5 py-0.5">
                            <Eye className="h-3 w-3" /> Eye Doctor
                          </Badge>
                        ) : staff.role === "nurse" ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 gap-1 text-[10px] font-mono font-semibold uppercase rounded px-1.5 py-0.5">
                            <HeartHandshake className="h-3 w-3" /> School Nurse
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-300 gap-1 text-[10px] font-mono font-semibold uppercase rounded px-1.5 py-0.5">
                            <Stethoscope className="h-3 w-3" /> General Doctor
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs font-mono text-slate-500">
                        {new Date(staff.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit staff details and role"
                            onClick={() => {
                              setEditTarget(staff);
                              setEditName(staff.name);
                              setEditRole(staff.role === "doctor" ? "doctor_general" : staff.role);
                            }}
                            className="h-8 px-2 text-slate-600 hover:text-slate-900"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="Reset password"
                            onClick={() => {
                              setResetTarget(staff);
                              setNewPassword("");
                            }}
                            className="h-8 px-2 text-slate-600 hover:text-slate-900"
                          >
                            <KeyRound className="h-3.5 w-3.5 mr-1" />
                            Password
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            title={
                              isPrimaryAdmin
                                ? "Primary admin account cannot be deleted"
                                : isCurrent
                                ? "You cannot delete your own account"
                                : "Delete staff account"
                            }
                            disabled={isPrimaryAdmin || isCurrent}
                            onClick={() => setDeleteTarget(staff)}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Dialog: Add New Staff Member ───────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddStaff}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                Add Healthcare Staff / Doctor
              </DialogTitle>
              <DialogDescription>
                Create a login account for an incoming doctor, medical specialist, or school nurse.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="addName" className="text-xs font-semibold">
                  Full Name & Designation <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="addName"
                  placeholder="e.g. Dr. Sarah Thomas (Ophthalmology)"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addUsername" className="text-xs font-semibold">
                  Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="addUsername"
                  placeholder="e.g. drsarah or drdental"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  required
                  autoCapitalize="none"
                />
                <p className="text-[11px] text-slate-400">
                  Used by the staff member to sign in to the clinical terminal.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addRole" className="text-xs font-semibold">
                  Specialty & Access Level <span className="text-red-500">*</span>
                </Label>
                <Select value={addRole} onValueChange={setAddRole}>
                  <SelectTrigger id="addRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor_general">
                      <span className="flex items-center gap-2">
                        <Stethoscope className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>General Doctor / Physician</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="doctor_dental">
                      <span className="flex items-center gap-2">
                        <Smile className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>Dental Doctor / Dentist</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="doctor_eye">
                      <span className="flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>Eye Doctor / Ophthalmologist</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="nurse">
                      <span className="flex items-center gap-2">
                        <HeartHandshake className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>School Nurse</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="admin">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>System Administrator</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {addRole === "doctor_dental" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-teal-50/70 border border-teal-200 text-xs text-teal-800">
                    <Smile className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-semibold">Dental Doctor:</strong> Authorized to record and update dental health and oral cavity status. Vitals and eyesight stations are locked.
                    </div>
                  </div>
                )}
                {addRole === "doctor_eye" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-800">
                    <Eye className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-semibold">Eye Doctor:</strong> Authorized to test and record Left/Right visual acuity. Vitals and dental stations are locked.
                    </div>
                  </div>
                )}
                {addRole === "doctor_general" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-blue-50/70 border border-blue-200 text-xs text-blue-800">
                    <Stethoscope className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-semibold">General Doctor:</strong> Authorized to record height, weight, BMI, blood pressure, ENT screening, and general physical assessment.
                    </div>
                  </div>
                )}
                {addRole === "nurse" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800">
                    <HeartHandshake className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-semibold">School Nurse:</strong> Authorized to record screening vitals and student immunizations.
                    </div>
                  </div>
                )}
                {addRole === "admin" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50/70 border border-amber-200 text-xs text-amber-800">
                    <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-semibold">Administrator:</strong> Full unrestricted access across all clinical examination stations and staff credentials management.
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addPassword" className="text-xs font-semibold">
                  Initial Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="addPassword"
                    type={showAddPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {isSubmitting ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Edit Staff Member ───────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditStaff}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <Pencil className="h-5 w-5 text-blue-600" />
                Edit Staff Member
              </DialogTitle>
              <DialogDescription>
                Update profile details or modify clinical specialty & permissions for <strong>@{editTarget?.username}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="editName" className="text-xs font-semibold">
                  Full Name & Designation <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editRole" className="text-xs font-semibold">
                  Specialty & Privileges <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editRole}
                  onValueChange={setEditRole}
                  disabled={editTarget?.username === "admin"}
                >
                  <SelectTrigger id="editRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor_general">
                      <span className="flex items-center gap-2">
                        <Stethoscope className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>General Doctor / Physician</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="doctor_dental">
                      <span className="flex items-center gap-2">
                        <Smile className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>Dental Doctor / Dentist</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="doctor_eye">
                      <span className="flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>Eye Doctor / Ophthalmologist</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="nurse">
                      <span className="flex items-center gap-2">
                        <HeartHandshake className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>School Nurse</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="admin">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>System Administrator</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {editTarget?.username === "admin" && (
                  <p className="text-[11px] text-amber-600">
                    The primary administrator account role cannot be reassigned.
                  </p>
                )}

                {editRole === "doctor_dental" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-teal-50/70 border border-teal-200 text-xs text-teal-800">
                    <Smile className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-semibold">Dental Doctor:</strong> Authorized to record and update dental health and oral cavity status. Vitals and eyesight stations are locked.
                    </div>
                  </div>
                )}
                {editRole === "doctor_eye" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-800">
                    <Eye className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-semibold">Eye Doctor:</strong> Authorized to test and record Left/Right visual acuity. Vitals and dental stations are locked.
                    </div>
                  </div>
                )}
                {editRole === "doctor_general" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-blue-50/70 border border-blue-200 text-xs text-blue-800">
                    <Stethoscope className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-semibold">General Doctor:</strong> Authorized to record height, weight, BMI, blood pressure, ENT screening, and general physical assessment.
                    </div>
                  </div>
                )}
                {editRole === "nurse" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800">
                    <HeartHandshake className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-semibold">School Nurse:</strong> Authorized to record screening vitals and student immunizations.
                    </div>
                  </div>
                )}
                {editRole === "admin" && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50/70 border border-amber-200 text-xs text-amber-800">
                    <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-semibold">Administrator:</strong> Full unrestricted access across all clinical examination stations and staff credentials management.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isEditing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Reset Password ────────────────────────────────────────── */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-600" />
                Reset Password
              </DialogTitle>
              <DialogDescription>
                Assign a new password for <strong>{resetTarget?.name}</strong> (@{resetTarget?.username}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div className="p-3 rounded-lg bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-emerald-950">Password Active &amp; Encrypted</p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    This account already has an active encrypted password. For security, passwords are never stored or displayed in plain text. Enter a new password below only if you wish to change it.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="resetNewPass" className="text-xs font-semibold">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="resetNewPass"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetTarget(null)}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isResetting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isResetting ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Alert Dialog: Delete Staff Confirmation ───────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Remove Staff Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong> (@{deleteTarget?.username})?
              They will no longer be able to log in to the School Health Record System.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStaff}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Removing..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
