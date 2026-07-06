"use client";

import { useState, useEffect } from "react";
import { getDashboardMetrics } from "@/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyINR } from "@/lib/utils/format";
import { SectionPanel } from "@/components/shared/section-panel";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import Link from "next/link";

const REPORTS = [
  { id: "driver", title: "Driver Report", href: "/api/export/driver?format=xlsx" },
  { id: "vehicle", title: "Vehicle Report", href: "/api/export/vehicle?format=xlsx" },
  { id: "expense", title: "Expense Report", href: "/api/export/expense?format=xlsx" },
  { id: "financial", title: "Financial P&L", href: "/api/export/financial?format=xlsx" },
  { id: "settlement", title: "Bill Settlement", href: "/api/export/settlement?format=xlsx" },
  { id: "trips", title: "Trips Report", href: "/api/export/trips?format=xlsx" },
];

const COLORS = ['var(--primary)', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ReportsDashboard() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const fetchMetrics = async () => {
      setLoading(true);
      const res = await getDashboardMetrics(from, to);
      if (active && res.success) {
        setData(res);
      }
      if (active) setLoading(false);
    };
    fetchMetrics();
    return () => { active = false; };
  }, [from, to]);

  const queryParams = `from=${from}&to=${to}`;

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card className="border-border/50 bg-muted/20">
        <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-4">
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label>Date From</Label>
            <Input 
              type="date" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label>Date To</Label>
            <Input 
              type="date" 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              className="bg-background"
            />
          </div>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => { setFrom(""); setTo(""); }}>
            Reset Filters
          </Button>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrencyINR(data.kpis.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrencyINR(data.kpis.totalExpenses)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrencyINR(data.kpis.netProfit)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.kpis.totalTrips}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Revenue vs Expense Chart */}
            <Card className="col-span-full lg:col-span-2">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {data.chartData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip formatter={(v: number) => formatCurrencyINR(v)} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No financial data</div>
                )}
              </CardContent>
            </Card>

            {/* Status Breakdowns */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Status</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {data.tripStatusData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.tripStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.tripStatusData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No trip data</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Export List */}
      <SectionPanel title="Export Reports">
        <ul className="divide-y divide-border/60">
          {REPORTS.map((r) => {
            const base = r.href.split("?")[0];
            const q = `format=xlsx&${from ? `from=${from}` : ""}&${to ? `to=${to}` : ""}`;
            const pdfQ = `format=pdf&${from ? `from=${from}` : ""}&${to ? `to=${to}` : ""}`;
            
            return (
              <li
                key={r.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 px-2 rounded-md transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{r.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Download filtered data in Excel or PDF format
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild size="sm" variant="outline" className="bg-background">
                    <Link href={`${base}?${q}`}>
                      <Download className="h-4 w-4 mr-2" />
                      Excel
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="bg-background">
                    <Link href={`${base}?${pdfQ}`}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </SectionPanel>
    </div>
  );
}
