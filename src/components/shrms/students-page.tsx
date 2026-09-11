"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { formatDate, initialsOf } from "@/lib/helpers";
import { CLASSES, SECTIONS } from "@/lib/constants";
import type { StudentListResponse } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StudentModal from "@/components/shrms/modals/student-modal";

type SortField = "admissionNumber" | "studentName" | "class" | "section" | "dob";

const PAGE_SIZE = 10;

interface StudentsPageProps {
  onOpenStudent: (admissionNumber: string) => void;
}

export default function StudentsPage({ onOpenStudent }: StudentsPageProps) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [sort, setSort] = useState<SortField>("admissionNumber");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StudentListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [failed, setFailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Instant (debounced) search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort,
      dir,
    });
    if (debouncedQ) params.set("q", debouncedQ);
    if (classFilter !== "all") params.set("class", classFilter);
    if (sectionFilter !== "all") params.set("section", sectionFilter);
    return params.toString();
  }, [page, sort, dir, debouncedQ, classFilter, sectionFilter]);

  const queryKey = `${queryString}|${refreshKey}`;
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    let cancelled = false;
    api<StudentListResponse>(`/api/students?${queryString}`)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setFailed(false);
          setLoadedKey(queryKey);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setFailed(true);
          setLoadedKey(queryKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [queryString, queryKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  function toggleSort(field: SortField) {
    if (sort === field) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setDir("asc");
    }
    setPage(1);
  }

  function sortIcon(field: SortField) {
    if (sort !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return dir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    );
  }

  const from = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Students</CardTitle>
            <CardDescription>
              Search, filter and open student health records.
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>

        {/* Filters */}
        <div className="grid gap-2 sm:grid-cols-[1fr_130px_130px] pt-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search admission no., name or parent…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
              aria-label="Search students"
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          <Select
            value={classFilter}
            onValueChange={(v) => {
              setClassFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter by class">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  Class {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sectionFilter}
            onValueChange={(v) => {
              setSectionFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter by section">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {SECTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  Section {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>
                  <button
                    className="flex items-center gap-1.5 font-medium"
                    onClick={() => toggleSort("admissionNumber")}
                  >
                    Admission No. {sortIcon("admissionNumber")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1.5 font-medium"
                    onClick={() => toggleSort("studentName")}
                  >
                    Student {sortIcon("studentName")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1.5 font-medium"
                    onClick={() => toggleSort("class")}
                  >
                    Class {sortIcon("class")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1.5 font-medium"
                    onClick={() => toggleSort("section")}
                  >
                    Section {sortIcon("section")}
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Gender</TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    className="flex items-center gap-1.5 font-medium"
                    onClick={() => toggleSort("dob")}
                  >
                    DOB {sortIcon("dob")}
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Blood Group</TableHead>
                <TableHead className="hidden lg:table-cell">Parent</TableHead>
                <TableHead className="hidden xl:table-cell">Contact</TableHead>
                <TableHead className="text-right">Record {new Date().getFullYear() - (new Date().getMonth() >= 3 ? 0 : 1)}</TableHead>
                <TableHead className="w-16" aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && data && data.data.length > 0 ? (
                data.data.map((s) => (
                  <TableRow
                    key={s.admissionNumber}
                    className="cursor-pointer"
                    onClick={() => onOpenStudent(s.admissionNumber)}
                  >
                    <TableCell className="font-mono text-xs font-medium">
                      {s.admissionNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {initialsOf(s.studentName)}
                        </div>
                        <span className="font-medium text-sm">{s.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.class}</TableCell>
                    <TableCell className="text-sm">{s.section}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{s.gender}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(s.dob)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {s.bloodGroup}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{s.parentName}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {s.phone}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.hasRecordThisYear ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                          Completed
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        aria-label={`Open record for ${s.studentName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStudent(s.admissionNumber);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="h-36 text-center">
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    ) : (
                      <div>
                        <p className="text-sm font-medium">
                          {failed ? "Failed to load students" : "No students found"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {failed
                            ? "Please try again."
                            : "Try a different search, or add a new student."}
                        </p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Showing {from}–{to} of {data?.total ?? 0} students
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {data?.page ?? page} of {data?.totalPages ?? 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!data || page >= data.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      <StudentModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() => {
          setAddOpen(false);
          setPage(1);
          refetch();
        }}
      />
    </Card>
  );
}
