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
    <Card className="border-blue-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-primary" />
          Activity Log
        </CardTitle>
        <CardDescription>
          Every login, edit and file action is recorded for audit purposes.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading && !data ? (
          <div className="space-y-2 p-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-44">Time</TableHead>
                    <TableHead className="w-28">Actor</TableHead>
                    <TableHead className="w-52">Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data && data.data.length > 0 ? (
                    data.data.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(e.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              e.role === "parent"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }
                          >
                            {e.actor}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{e.action}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {e.details}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No activity recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {data?.total ?? 0} events
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
