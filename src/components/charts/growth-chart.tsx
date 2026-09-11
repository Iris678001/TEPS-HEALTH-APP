"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GrowthPoint } from "@/lib/types";

const COLORS = {
  height: "#2563eb",
  weight: "#10b981",
  bmi: "#f59e0b",
} as const;

const GRID_STROKE = "#e5e7eb";
const AXIS_LABEL_STYLE = { fill: "#6b7280", fontSize: 12 } as const;
const TICK_STYLE = { fontSize: 12, fill: "#6b7280" } as const;

const SERIES_UNITS: Record<string, string> = {
  height: "cm",
  weight: "kg",
  bmi: "",
};

interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
}

interface GrowthTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<TooltipEntry>;
}

/** 132 -> "132", 28.5 -> "28.5" */
function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function GrowthTooltip({ active, label, payload }: GrowthTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[170px] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
      <p className="mb-1.5 text-xs font-medium text-slate-500">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const seriesKey = String(entry.dataKey ?? entry.name ?? "").toLowerCase();
          const unit = SERIES_UNITS[seriesKey] ?? "";
          const numeric =
            typeof entry.value === "number"
              ? entry.value
              : entry.value != null && !Number.isNaN(Number(entry.value))
                ? Number(entry.value)
                : null;
          return (
            <div key={`${seriesKey}-${index}`} className="flex w-full items-center gap-2 text-sm">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color ?? "#94a3b8" }}
              />
              <span className="text-slate-500">{entry.name}</span>
              <span className="ml-auto pl-4 font-semibold text-slate-900">
                {numeric !== null ? formatValue(numeric) : String(entry.value ?? "—")}
                {unit ? ` ${unit}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GrowthChart({ data }: { data: GrowthPoint[] }) {
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
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="shrmHeightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.height} stopOpacity={0.25} />
              <stop offset="60%" stopColor={COLORS.height} stopOpacity={0.08} />
              <stop offset="100%" stopColor={COLORS.height} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="academicYear"
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
            tickMargin={8}
          />
          <YAxis
            yAxisId="left"
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={false}
            width={48}
            label={{
              value: "Height (cm)",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", ...AXIS_LABEL_STYLE },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={false}
            width={48}
            label={{
              value: "Weight (kg)",
              angle: 90,
              position: "insideRight",
              style: { textAnchor: "middle", ...AXIS_LABEL_STYLE },
            }}
          />
          {/* BMI is drawn against the left side but scaled on its own hidden axis (10–30)
              so its small values stay readable next to height in cm. */}
          <YAxis yAxisId="bmi" orientation="left" domain={[10, 30]} hide />
          <Tooltip content={<GrowthTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }} />
          <Legend iconType="circle" iconSize={8} verticalAlign="bottom" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="height"
            name="Height"
            stroke={COLORS.height}
            strokeWidth={2.5}
            fill="url(#shrmHeightGradient)"
            dot={{ r: 3, strokeWidth: 2, stroke: "#ffffff", fill: COLORS.height }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="weight"
            name="Weight"
            stroke={COLORS.weight}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 2, stroke: "#ffffff", fill: COLORS.weight }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="bmi"
            type="monotone"
            dataKey="bmi"
            name="BMI"
            stroke={COLORS.bmi}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
