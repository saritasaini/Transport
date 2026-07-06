"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";

export async function getDashboardMetrics(from?: string, to?: string) {
  const ctx = await getSessionContext();
  if (!ctx?.effectiveCompanyId) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const companyId = ctx.effectiveCompanyId;

  try {
    // 1. Fetch Trips (for revenue, status, payment status, volume)
    let tripsQuery = supabase
      .from("trips")
      .select("id, trip_number, trip_date, status, payment_status, bill_amount, freight_amount")
      .eq("company_id", companyId)
      .is("deleted_at", null);
      
    if (from) tripsQuery = tripsQuery.gte("trip_date", from);
    if (to) tripsQuery = tripsQuery.lte("trip_date", to);

    const { data: trips, error: tripsError } = await tripsQuery;
    if (tripsError) throw new Error(tripsError.message);

    // 2. Fetch Expenses
    let expensesQuery = supabase
      .from("trip_expenses")
      .select("id, expense_date, amount, category")
      .eq("company_id", companyId)
      .is("deleted_at", null);
      
    if (from) expensesQuery = expensesQuery.gte("expense_date", from);
    if (to) expensesQuery = expensesQuery.lte("expense_date", to);

    const { data: expenses, error: expensesError } = await expensesQuery;
    if (expensesError) throw new Error(expensesError.message);

    // 3. Fetch Vehicles (Active)
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id")
      .eq("company_id", companyId)
      .eq("current_status", "active")
      .is("deleted_at", null);

    // Processing KPIs
    const totalTrips = trips?.length || 0;
    const activeVehicles = vehicles?.length || 0;
    
    let totalRevenue = 0;
    const statusCount: Record<string, number> = {
      pending: 0,
      assigned: 0,
      in_transit: 0,
      completed: 0,
      cancelled: 0
    };
    
    const paymentStatusCount: Record<string, number> = {
      unpaid: 0,
      partially_paid: 0,
      paid: 0
    };

    // Processing Chart Data (Daily Revenue/Expense)
    const dailyDataMap: Record<string, { date: string; revenue: number; expense: number }> = {};

    trips?.forEach((t) => {
      const income = Number(t.bill_amount || t.freight_amount || 0);
      totalRevenue += income;
      
      // Status breakdown
      if (t.status && statusCount[t.status] !== undefined) statusCount[t.status]++;
      
      // Payment status breakdown
      if (t.payment_status && paymentStatusCount[t.payment_status] !== undefined) {
        paymentStatusCount[t.payment_status]++;
      }

      // Group by Date for Chart
      const d = t.trip_date.split('T')[0];
      if (!dailyDataMap[d]) dailyDataMap[d] = { date: d, revenue: 0, expense: 0 };
      dailyDataMap[d].revenue += income;
    });

    let totalExpenses = 0;
    expenses?.forEach((e) => {
      const amount = Number(e.amount || 0);
      totalExpenses += amount;
      
      const d = e.expense_date.split('T')[0];
      if (!dailyDataMap[d]) dailyDataMap[d] = { date: d, revenue: 0, expense: 0 };
      dailyDataMap[d].expense += amount;
    });

    const netProfit = totalRevenue - totalExpenses;

    // Convert daily data map to sorted array
    const chartData = Object.values(dailyDataMap).sort((a, b) => a.date.localeCompare(b.date));

    // Format Donut Charts
    const tripStatusData = Object.entries(statusCount)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.replace("_", " ").toUpperCase(),
        value: count
      }));

    const paymentStatusData = Object.entries(paymentStatusCount)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.replace("_", " ").toUpperCase(),
        value: count
      }));

    return {
      success: true,
      kpis: {
        totalRevenue,
        totalExpenses,
        netProfit,
        totalTrips,
        activeVehicles
      },
      chartData,
      tripStatusData,
      paymentStatusData
    };
  } catch (error: any) {
    console.error("Dashboard Metrics Error:", error);
    return { error: error.message };
  }
}
