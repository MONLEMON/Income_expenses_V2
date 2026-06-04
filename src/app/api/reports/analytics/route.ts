import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, expenses } from "@/db/schema";
import { sql, and, eq } from "drizzle-orm";
import { z } from "zod";
import { verifyAuth } from "../../auth-helper";

const analyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start Date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End Date must be in YYYY-MM-DD format"),
});

export async function GET(request: Request) {
  try {
    // 1. Authorize session
    const decodedUser = verifyAuth(request);
    if (!decodedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = decodedUser.userId;

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const rawStart = searchParams.get("startDate");
    const rawEnd = searchParams.get("endDate");

    const parseResult = analyticsQuerySchema.safeParse({ startDate: rawStart, endDate: rawEnd });
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid or missing startDate/endDate" }, { status: 400 });
    }

    const { startDate, endDate } = parseResult.data;

    // 3. Calculate period length and prior period dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return NextResponse.json({ error: "Start date must be before or equal to end date" }, { status: 400 });
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - diffDays);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStartDateStr = prevStart.toISOString().split("T")[0];
    const prevEndDateStr = prevEnd.toISOString().split("T")[0];

    // 4. Query current period income (orders)
    const currentIncomeQuery = db
      .select({
        date: sql<string>`to_char(${orders.orderDate}, 'YYYY-MM-DD')`.as("date"),
        amount: sql<string>`sum(${orders.totalAmount})`.as("amount"),
      })
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        sql`${orders.orderDate} >= ${startDate + ' 00:00:00'}::timestamp`,
        sql`${orders.orderDate} <= ${endDate + ' 23:59:59'}::timestamp`
      ))
      .groupBy(sql`to_char(${orders.orderDate}, 'YYYY-MM-DD')`);

    // 5. Query current period expenses
    const currentExpensesQuery = db
      .select({
        date: expenses.expenseDate,
        amount: sql<string>`sum(${expenses.amount})`.as("amount"),
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`${expenses.expenseDate} >= ${startDate}`,
        sql`${expenses.expenseDate} <= ${endDate}`
      ))
      .groupBy(expenses.expenseDate);

    // 6. Query category expense totals
    const currentCategoryExpensesQuery = db
      .select({
        category: expenses.category,
        amount: sql<string>`sum(${expenses.amount})`.as("amount"),
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`${expenses.expenseDate} >= ${startDate}`,
        sql`${expenses.expenseDate} <= ${endDate}`
      ))
      .groupBy(expenses.category);

    // 7. Query income categories (grouped by payment method)
    const currentCategoryIncomeQuery = db
      .select({
        paymentMethod: orders.paymentMethod,
        amount: sql<string>`sum(${orders.totalAmount})`.as("amount"),
      })
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        sql`${orders.orderDate} >= ${startDate + ' 00:00:00'}::timestamp`,
        sql`${orders.orderDate} <= ${endDate + ' 23:59:59'}::timestamp`
      ))
      .groupBy(orders.paymentMethod);

    // 8. Query prior totals (for comparison KPIs)
    const priorIncomeQuery = db
      .select({
        total: sql<string>`sum(${orders.totalAmount})`.as("total"),
      })
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        sql`${orders.orderDate} >= ${prevStartDateStr + ' 00:00:00'}::timestamp`,
        sql`${orders.orderDate} <= ${prevEndDateStr + ' 23:59:59'}::timestamp`
      ));

    const priorExpensesQuery = db
      .select({
        total: sql<string>`sum(${expenses.amount})`.as("total"),
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`${expenses.expenseDate} >= ${prevStartDateStr}`,
        sql`${expenses.expenseDate} <= ${prevEndDateStr}`
      ));

    // Resolve current queries
    const [
      incomeData, 
      expenseData, 
      categoryExpenses, 
      categoryIncome,
      priorIncomeResult,
      priorExpensesResult
    ] = await Promise.all([
      currentIncomeQuery,
      currentExpensesQuery,
      currentCategoryExpensesQuery,
      currentCategoryIncomeQuery,
      priorIncomeQuery,
      priorExpensesQuery
    ]);

    // 9. Format Daily Cash Flow (combining income and expense by date)
    const dailyMap = new Map<string, { date: string; income: number; expense: number }>();
    
    // Fill all dates in range with 0
    const dateCursor = new Date(start);
    while (dateCursor <= end) {
      const dateStr = dateCursor.toISOString().split("T")[0];
      dailyMap.set(dateStr, { date: dateStr, income: 0, expense: 0 });
      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    incomeData.forEach((row) => {
      if (row.date && dailyMap.has(row.date)) {
        dailyMap.get(row.date)!.income = parseFloat(row.amount) || 0;
      }
    });

    expenseData.forEach((row) => {
      if (row.date && dailyMap.has(row.date)) {
        dailyMap.get(row.date)!.expense = parseFloat(row.amount) || 0;
      }
    });

    const dailyTrends = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 10. Calculate KPI totals and Net Profits
    const totalIncome = incomeData.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const totalExpense = expenseData.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const savingsRate = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    const dailyAvgIncome = totalIncome / diffDays;
    const dailyAvgExpense = totalExpense / diffDays;

    // 11. Prior Period KPIs & Comparison Calculation
    const priorIncome = parseFloat(priorIncomeResult[0]?.total) || 0;
    const priorExpense = parseFloat(priorExpensesResult[0]?.total) || 0;
    const priorNetProfit = priorIncome - priorExpense;

    const incomeChange = priorIncome > 0 ? ((totalIncome - priorIncome) / priorIncome) * 100 : null;
    const expenseChange = priorExpense > 0 ? ((totalExpense - priorExpense) / priorExpense) * 100 : null;
    
    let profitChange = null;
    if (priorNetProfit !== 0) {
      profitChange = ((netProfit - priorNetProfit) / Math.abs(priorNetProfit)) * 100;
    }

    // 12. Format Categories Summary lists
    const formattedExpenses = categoryExpenses.map((c) => ({
      category: c.category || "Other Expenses",
      amount: parseFloat(c.amount) || 0,
      percentage: totalExpense > 0 ? ((parseFloat(c.amount) || 0) / totalExpense) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    const formattedIncome = categoryIncome.map((c) => ({
      category: c.paymentMethod || "POS Sales",
      amount: parseFloat(c.amount) || 0,
      percentage: totalIncome > 0 ? ((parseFloat(c.amount) || 0) / totalIncome) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      dailyTrends,
      kpis: {
        totalIncome,
        totalExpense,
        netProfit,
        profitMargin,
        savingsRate,
        dailyAvgIncome,
        dailyAvgExpense,
        diffDays,
      },
      comparison: {
        priorStartDate: prevStartDateStr,
        priorEndDate: prevEndDateStr,
        incomeChange,
        expenseChange,
        profitChange,
      },
      breakdowns: {
        expenses: formattedExpenses,
        income: formattedIncome,
      }
    });

  } catch (error) {
    console.error("Error fetching financial analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
