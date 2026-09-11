"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface CheckupsByClass {
  label: string;
  checkups: number;
  students: number;
}

const COLORS = {
  checkups: "#2563eb",
  students: "#93c5fd",
} as const;

const GRID_STROKE = "#e5e7eb";
const TICK_STYLE = { fontSize: 12, fill: "#6b7280" } as const;

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
}

interface CheckupsTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<TooltipEntry>;
}

function CheckupsTooltip({ active, label, payload }: CheckupsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[160px] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
      <p className="mb-1.5 text-xs font-medium text-slate-500">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={`${entry.name ?? "series"}-${index}`} className="flex w-full items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? "#94a3b8" }}
            />
            <span className="text-slate-500">{entry.name}</span>
            <span className="ml-auto pl-4 font-semibold text-slate-900">
              {typeof entry.value === "number" ? entry.value : String(entry.value ?? "—")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CheckupsBar({ data }: { data: CheckupsByClass[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[280px] w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available yet</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={6} barCategoryGap="24%">
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={TICK_STYLE} tickLine={false} axisLine={{ stroke: GRID_STROKE }} tickMargin={8} />
          <YAxis allowDecimals={false} tick={TICK_STYLE} tickLine={false} axisLine={false} width={36} />
          <Tooltip content={<CheckupsTooltip />} cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} />
          <Legend iconType="circle" iconSize={8} verticalAlign="bottom" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="checkups" name="Checkups done" fill={COLORS.checkups} radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="students" name="Total students" fill={COLORS.students} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
