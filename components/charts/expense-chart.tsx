"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt } from "lucide-react";

export function ExpenseChart({
  expenses,
}: {
  expenses: { category: string; amount: number }[];
}) {
  const byCat: Record<string, number> = {};
  expenses.forEach((e) => {
    byCat[e.category] = (byCat[e.category] ?? 0) + Number(e.amount);
  });
  const data = Object.entries(byCat).map(([name, total]) => ({ name, total }));

  if (!data.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expense data"
        description="Expenses by category will appear here."
        compact
        className="rounded-none border-0"
      />
    );
  }

  return (
    <div className="h-64 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          />
          <Bar dataKey="total" fill="var(--primary)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
