"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface NutritionSlice {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  Normal: "#10b981",
  Underweight: "#f59e0b",
  Overweight: "#f97316",
  Obese: "#ef4444",
  Malnourished: "#8b5cf6",
};

const FALLBACK_COLOR = "#3b82f6";

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
}

interface NutritionTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
}

function NutritionTooltip({ active, payload }: NutritionTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  if (!entry) return null;

  const count = typeof entry.value === "number" ? entry.value : Number(entry.value);
  if (Number.isNaN(count)) return null;

  return (
    <div className="min-w-[120px] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: entry.color ?? FALLBACK_COLOR }}
        />
        <span className="text-slate-500">{entry.name}</span>
      </div>
      <p className="mt-1 pl-4 text-sm font-semibold text-slate-900">
        {count} {count === 1 ? "student" : "students"}
      </p>
    </div>
  );
}

export default function NutritionPie({ data }: { data: NutritionSlice[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[280px] w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available yet</p>
      </div>
    );
  }

  const total = data.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            cornerRadius={4}
            startAngle={90}
            endAngle={-270}
            stroke="#ffffff"
            strokeWidth={2}
          >
            {data.map((slice, index) => (
              <Cell key={`${slice.status}-${index}`} fill={STATUS_COLORS[slice.status] ?? FALLBACK_COLOR} />
            ))}
          </Pie>
          <Tooltip content={<NutritionTooltip />} />
          <Legend iconType="circle" iconSize={8} verticalAlign="bottom" wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
          {/* Total in the donut hole (pie center sits slightly above the SVG center due to the legend) */}
          <text
            x="50%"
            y="43%"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={24}
            fontWeight={700}
            fill="#0f172a"
          >
            {total}
          </text>
          <text x="50%" y="57%" textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#64748b">
            students
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
