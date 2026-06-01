import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, expenses } from "@/db/schema";
import { sql, and, eq } from "drizzle-orm";
import { z } from "zod";
import { verifyAuth } from "../../auth-helper";

const monthlySummaryQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/).optional(),
});

export async function GET(request: Request) {
  try {
    // 1. Authorize session
    const decodedUser = verifyAuth(request);
    if (!decodedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decodedUser.userId;

    // 2. Parse search parameters
    const { searchParams } = new URL(request.url);
    const rawYear = searchParams.get("year") || undefined;

    const parseResult = monthlySummaryQuerySchema.safeParse({ year: rawYear });
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { year } = parseResult.data;

    // 3. Build conditions
    const incomeCondition = and(
      eq(orders.userId, userId),
      year ? sql`to_char(${orders.orderDate}, 'YYYY') = ${year}` : undefined
    );
    
    const expenseCondition = and(
      eq(expenses.userId, userId),
      year ? sql`to_char(${expenses.expenseDate}, 'YYYY') = ${year}` : undefined
    );

    // 4. Query income grouped by month
    const incomeQuery = db
      .select({
        month: sql<string>`to_char(${orders.orderDate}, 'YYYY-MM')`.as("month"),
        totalIncome: sql<string>`sum(${orders.totalAmount})`.as("total_income"),
      })
      .from(orders)
      .where(incomeCondition)
      .groupBy(sql`to_char(${orders.orderDate}, 'YYYY-MM')`);

    // 5. Query expenses grouped by month
    const expenseQuery = db
      .select({
        month: sql<string>`to_char(${expenses.expenseDate}, 'YYYY-MM')`.as("month"),
        totalExpense: sql<string>`sum(${expenses.amount})`.as("total_expense"),
      })
      .from(expenses)
      .where(expenseCondition)
      .groupBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`);

    const [incomeData, expenseData] = await Promise.all([
      incomeQuery,
      expenseQuery,
    ]);

    // 6. Merge in memory
    const summaryMap = new Map<string, { month: string; totalIncome: number; totalExpense: number }>();

    incomeData.forEach((item) => {
      if (item.month) {
        summaryMap.set(item.month, {
          month: item.month,
          totalIncome: parseFloat(item.totalIncome) || 0,
          totalExpense: 0,
        });
      }
    });

    expenseData.forEach((item) => {
      if (item.month) {
        const existing = summaryMap.get(item.month);
        if (existing) {
          existing.totalExpense = parseFloat(item.totalExpense) || 0;
        } else {
          summaryMap.set(item.month, {
            month: item.month,
            totalIncome: 0,
            totalExpense: parseFloat(item.totalExpense) || 0,
          });
        }
      }
    });

    const result = Array.from(summaryMap.values())
      .map((item) => ({
        ...item,
        netProfit: item.totalIncome - item.totalExpense,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // Calculate totals for KPI cards
    const totalIncome = result.reduce((sum, item) => sum + item.totalIncome, 0);
    const totalExpense = result.reduce((sum, item) => sum + item.totalExpense, 0);
    const totalBalance = totalIncome - totalExpense;
    const totalSaving = totalBalance * 0.2; // Mock 20% savings

    return NextResponse.json({
      summary: result,
      kpis: {
        totalIncome,
        totalExpense,
        totalBalance,
        totalSaving,
        incomeTrend: 12, // Mock trends
        expenseTrend: -5,
        balanceTrend: 30,
        savingTrend: 8
      }
    });
  } catch (error) {
    console.error("Error fetching monthly summary:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
