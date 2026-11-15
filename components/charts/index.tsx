"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const axisStyle = {
  fontSize: 11,
  fill: "var(--ink-faint)",
  fontFamily: "inherit",
};

function ChartTooltip({ active, payload, label, currency = false }: any) {
  if (!active || !payload?.length) return null;
  const fmt = (v: number) =>
    currency ? "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : String(v);
  return (
    <div className="rounded-xl border border-line bg-canvas-raised px-3 py-2 shadow-overlay">
      {label && <p className="mb-1 text-[11px] font-medium text-ink-faint">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[13px]">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-ink-soft">{p.name}:</span>
          <span className="font-medium text-ink">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueArea({ data, currency = true }: { data: any[]; currency?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={42} />
        <Tooltip content={<ChartTooltip currency={currency} />} />
        <Area
          type="monotone"
          dataKey="value"
          name="Revenue"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#rev)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PipelineBars({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={42} />
        <Tooltip content={<ChartTooltip currency />} cursor={{ fill: "var(--canvas-subtle)" }} />
        <Bar dataKey="value" name="Pipeline" radius={[6, 6, 0, 0]} maxBarSize={44}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || "var(--accent)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Tooltip content={<ChartTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-4">
        <span className="text-lg font-semibold text-ink">{centerValue || total}</span>
        {centerLabel && <span className="text-[11px] text-ink-faint">{centerLabel}</span>}
      </div>
    </div>
  );
}

export function Sparkline({ data, color = "var(--accent)" }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WeeklyChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={30} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--canvas-subtle)" }} />
        <Bar dataKey="completed" name="Completed" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="created" name="Created" fill="var(--ink-faint)" radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}