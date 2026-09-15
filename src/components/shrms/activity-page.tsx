"use client";

import { useEffect, useState } from "react";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/helpers";
import type { ActivityLogResponse } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

export default function ActivityPage() {
  const [data, setData] = useState<ActivityLogResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryKey = String(page);
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    let cancelled = false;
    api<ActivityLogResponse>(`/api/activity?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
          setLoadedKey(queryKey);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load activity log.");
          setLoadedKey(queryKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page, queryKey]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Card className="border-slate-200 shadow-2xs rounded-md bg-white font-sans">
      <CardHeader className="border-b border-slate-100 pb-3">
        <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-600" />
          Clinical Workstation Audit &amp; Activity Ledger
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 font-mono">
          Immutable audit trail recording clinician logins, health record edits, document uploads, and student updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading && !data ? (
          <div className="space-y-2 p-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                    <TableHead className="w-44 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">Timestamp</TableHead>
                    <TableHead className="w-28 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">Actor</TableHead>
                    <TableHead className="w-52 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">Action Type</TableHead>
                    <TableHead className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">Audit Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data && data.data.length > 0 ? (
                    data.data.map((e) => (
                      <TableRow key={e.id} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors">
                        <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                          {formatDateTime(e.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              e.role === "parent"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[10px] font-semibold rounded px-1.5 py-0.2"
                                : "bg-slate-100 text-slate-800 border-slate-300 font-mono text-[10px] font-semibold rounded px-1.5 py-0.2"
                            }
                          >
                            {e.actor}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800 font-mono">{e.action}</TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {e.details}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-xs font-mono text-slate-400">
                        Zero audit records filed yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 bg-slate-50/50">
              <p className="text-[11px] font-mono text-slate-500">
                Total <strong className="text-slate-800">{data?.total ?? 0}</strong> recorded events
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
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-slate-200"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
