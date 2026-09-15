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
import { calculateAge, formatDate, initialsOf } from "@/lib/helpers";
import { CLASSES, SECTIONS } from "@/lib/constants";
import type { SessionUser, StudentListResponse } from "@/lib/types";
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
  currentUser?: SessionUser | null;
}

export default function StudentsPage({ onOpenStudent, currentUser }: StudentsPageProps) {
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
    <Card className="border-slate-200 shadow-2xs rounded-md bg-white">
      <CardHeader className="pb-4 border-b border-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                Student Health Registry &amp; Census
              </CardTitle>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                Active Cohort
              </span>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Demographic indexing, student health records, and clinical examination status.
            </CardDescription>
          </div>
          {currentUser?.role === "admin" && (
            <Button size="sm" className="gap-1.5 h-8 text-xs font-semibold" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Register Student
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="grid gap-2 sm:grid-cols-[1fr_140px_140px] pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by admission ID, student name, or guardian…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 h-8 text-xs font-sans border-slate-200 bg-slate-50/50 focus:bg-white"
              aria-label="Search students"
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-400" />
            ) : null}
          </div>
          <Select
            value={classFilter}
            onValueChange={(v) => {
              setClassFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter by class" className="h-8 text-xs border-slate-200">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Classes</SelectItem>
              {CLASSES.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
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
            <SelectTrigger aria-label="Filter by section" className="h-8 text-xs border-slate-200">
              <SelectValue placeholder="All Sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Sections</SelectItem>
              {SECTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
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
              <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                <TableHead className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
                  <button
                    className="flex items-center gap-1 font-mono font-semibold"
                    onClick={() => toggleSort("admissionNumber")}
                  >
                    Adm. ID {sortIcon("admissionNumber")}
                  </button>
                </TableHead>
                <TableHead className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
                  <button
                    className="flex items-center gap-1 font-mono font-semibold"
                    onClick={() => toggleSort("studentName")}
                  >
                    Student Demographics {sortIcon("studentName")}
                  </button>
                </TableHead>
                <TableHead className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
                  <button
                    className="flex items-center gap-1 font-mono font-semibold"
                    onClick={() => toggleSort("class")}
                  >
                    Class {sortIcon("class")}
                  </button>
                </TableHead>
                <TableHead className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
                  <button
                    className="flex items-center gap-1 font-mono font-semibold"
                    onClick={() => toggleSort("section")}
                  >
                    Sec {sortIcon("section")}
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
                  Gender
                </TableHead>
                <TableHead className="hidden md:table-cell text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
                  <button
                    className="flex items-center gap-1 font-mono font-semibold"
                    onClick={() => toggleSort("dob")}
                  >
                    DOB / Calculated Age {sortIcon("dob")}
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
                  Blood Group
                </TableHead>
                <TableHead className="hidden lg:table-cell text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
                  Guardian / Contact
                </TableHead>
                <TableHead className="text-right text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
                  AY {new Date().getFullYear() - (new Date().getMonth() >= 3 ? 0 : 1)} Screening
                </TableHead>
                <TableHead className="w-14" aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && data && data.data.length > 0 ? (
                data.data.map((s) => (
                  <TableRow
                    key={s.admissionNumber}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                    onClick={() => onOpenStudent(s.admissionNumber)}
                  >
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {s.admissionNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded border border-slate-200 bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono font-semibold shrink-0">
                          {initialsOf(s.studentName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 leading-tight truncate">
                            {s.studentName}
                          </p>
                          {s.parentName && (
                            <p className="text-[10px] text-slate-400 truncate">
                              {s.parentName}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-slate-700">{s.class}</TableCell>
                    <TableCell className="text-xs font-mono font-medium text-slate-700">{s.section}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-slate-600">{s.gender}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs whitespace-nowrap">
                      <div className="text-slate-700 font-mono text-[11px]">{formatDate(s.dob)}</div>
                      {calculateAge(s.dob) && (
                        <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded inline-block mt-0.5">
                          Age: {calculateAge(s.dob)?.formatted}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="font-mono text-[10px] font-semibold bg-rose-50 text-rose-800 border-rose-200 rounded px-1.5 py-0.2">
                        {s.bloodGroup}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-slate-600">
                      <div className="truncate font-medium text-slate-800">{s.parentName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{s.phone}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {s.hasRecordThisYear ? (
                        <span className="inline-flex items-center text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-2 py-0.5">
                          Screened
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-0.5">
                          Pending Exam
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        aria-label={`Open record for ${s.studentName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStudent(s.admissionNumber);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-36 text-center">
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {failed ? "Failed to load patient census" : "No student records matched query"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {failed
                            ? "Please check system connectivity or retry."
                            : "Adjust search filter or register a new student."}
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
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 bg-slate-50/50">
          <p className="text-[11px] font-mono text-slate-500">
            Showing <strong className="text-slate-800">{from}–{to}</strong> of <strong className="text-slate-800">{data?.total ?? 0}</strong> registered students
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-slate-200"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
              Prev
            </Button>
            <span className="text-[11px] font-mono text-slate-500">
              Page {data?.page ?? page} of {data?.totalPages ?? 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-slate-200"
              disabled={!data || page >= data.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </CardContent>

      {currentUser?.role === "admin" && (
        <StudentModal
          open={addOpen}
          onOpenChange={setAddOpen}
          onSaved={() => {
            setAddOpen(false);
            setPage(1);
            refetch();
          }}
        />
      )}
    </Card>
  );
}
