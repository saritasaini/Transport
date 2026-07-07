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
import { Download, Loader2, Fuel, User, Wrench, Package } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
          <div className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            AGGREGATE FINANCIAL DEEP DIVE — {data.kpis.totalTrips} Trips
          </div>
          <div className="grid gap-6 lg:grid-cols-4 mb-6">
            <SectionPanel className="lg:col-span-2 bg-white border border-slate-200 shadow-sm" contentClassName="p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-red-600 font-bold">↓</span>
                <h3 className="font-semibold text-slate-900 text-lg">Cost breakdown</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="bg-red-50 p-2 rounded-md"><Fuel className="w-4 h-4 text-red-500" /></div>
                    <span className="font-medium">Fuel</span>
                  </div>
                  <span className="font-semibold text-red-700">{formatCurrencyINR(data.kpis.expenseBreakdown.fuel)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="bg-indigo-50 p-2 rounded-md"><User className="w-4 h-4 text-indigo-500" /></div>
                    <span className="font-medium">Driver pay</span>
                  </div>
                  <span className="font-semibold text-red-700">{formatCurrencyINR(data.kpis.expenseBreakdown.driverPay)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="bg-emerald-50 p-2 rounded-md"><span className="w-4 h-4 text-emerald-600 font-bold leading-none block text-center">T</span></div>
                    <span className="font-medium">Toll charges</span>
                  </div>
                  <span className="font-semibold text-red-700">{formatCurrencyINR(data.kpis.expenseBreakdown.tollMisc)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="bg-purple-50 p-2 rounded-md"><Wrench className="w-4 h-4 text-purple-500" /></div>
                    <span className="font-medium">Vehicle maintenance</span>
                  </div>
                  <span className="font-semibold text-red-700">{formatCurrencyINR(data.kpis.expenseBreakdown.maintenance)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="font-bold text-slate-900">Total cost</span>
                  <span className="font-bold text-red-700">{formatCurrencyINR(data.kpis.totalExpenses)}</span>
                </div>
              </div>
            </SectionPanel>

            <SectionPanel className="lg:col-span-2 bg-white border border-slate-200 shadow-sm" contentClassName="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-emerald-600 font-bold">↑</span>
                  <h3 className="font-semibold text-slate-900 text-lg">Revenue & margin</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Total Freight charged</span>
                    <span className="font-medium text-emerald-700">{formatCurrencyINR(data.kpis.totalRevenue)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Total cost</span>
                    <span className="font-medium text-red-700">{formatCurrencyINR(data.kpis.totalExpenses)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Net profit</span>
                    <span className="font-medium text-emerald-700">{formatCurrencyINR(data.kpis.netProfit)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Margin</span>
                    <span className="font-medium text-emerald-700">{data.kpis.margin.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-100">
                <span className="font-bold text-slate-900">Overall P&L result</span>
                <div className="flex items-center gap-3">
                  <span className={cn("font-medium", data.kpis.netProfit < 0 ? "text-red-600" : "text-emerald-600")}>
                    {data.kpis.netProfit < 0 ? "Loss" : "Profitable"}
                  </span>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold",
                    data.kpis.netProfit < 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {data.kpis.netProfit < 0 ? "" : "+"}{data.kpis.margin.toFixed(0)}%
                  </span>
                </div>
              </div>
            </SectionPanel>
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
