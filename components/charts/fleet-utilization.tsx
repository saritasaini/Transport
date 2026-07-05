"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { Truck } from "lucide-react";
import { useMemo } from "react";

const STATUS_COLORS: Record<string, string> = {
  available: "#1d4ed8", // blue-700
  maintenance: "#0d9488", // teal-600
  on_trip: "#f59e0b", // amber-500
  default: "#64748b", // slate-500
};

export function FleetUtilizationChart({
  vehicles,
}: {
  vehicles: { current_status: string }[];
}) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach((v) => {
      const status = v.current_status?.toLowerCase() || "unknown";
      counts[status] = (counts[status] ?? 0) + 1;
    });

    return Object.entries(counts).map(([key, value]) => ({
      name: key.replace(/_/g, " "),
      key,
      value,
      color: STATUS_COLORS[key] || STATUS_COLORS.default,
    })).sort((a, b) => b.value - a.value);
  }, [vehicles]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

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

  const largestGroup = data[0];
  const largestPercentage = Math.round((largestGroup.value / total) * 100);

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch w-full">
      {/* Left side: Chart */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-[200px]">
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Inner Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-slate-900 leading-none">
              {largestPercentage}%
            </span>
            <span className="text-sm text-slate-500 capitalize mt-1">
              {largestGroup.name}
            </span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {data.map((entry, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-sm" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-slate-600 capitalize">
                {entry.name} ({Math.round((entry.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side: Stats */}
      <div className="flex-1 flex flex-col justify-center w-full sm:pl-4">
        <div className="space-y-3 mb-4">
          {data.map((entry, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium text-slate-700 capitalize">
                  {entry.name}
                </span>
              </div>
              <span 
                className="text-sm font-semibold"
                style={{ color: entry.color }}
              >
                {Math.round((entry.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
        
        <div className="h-px bg-slate-100 w-full mb-4" />
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Total Vehicles</span>
            <span className="text-sm font-semibold text-slate-900">{total}</span>
          </div>
          {data.map((entry, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium capitalize">{entry.name}</span>
              <span 
                className="text-sm font-semibold"
                style={{ color: entry.color }}
              >
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
