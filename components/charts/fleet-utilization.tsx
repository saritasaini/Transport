"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { Truck } from "lucide-react";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

export function FleetUtilizationChart({
  vehicles,
}: {
  vehicles: { current_status: string }[];
}) {
  const counts: Record<string, number> = {};
  vehicles.forEach((v) => {
    counts[v.current_status] = (counts[v.current_status] ?? 0) + 1;
  });
  const data = Object.entries(counts).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Truck}
        title="No vehicles in fleet"
        description="Add vehicles to see utilization breakdown."
        compact
        className="rounded-none border-0 bg-transparent"
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={76}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            fontSize: "0.8125rem",
            background: "var(--card)",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "0.8125rem" }}
          formatter={(value) => (
            <span className="capitalize text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
