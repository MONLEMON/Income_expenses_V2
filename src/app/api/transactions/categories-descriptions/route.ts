import { NextResponse } from "next/server";
import { db } from "@/db";
import { expenses, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyAuth } from "../../auth-helper";

export async function GET(request: Request) {
  try {
    // 1. Authorize session
    const decodedUser = verifyAuth(request);
    if (!decodedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decodedUser.userId;

    // 2. Fetch expense categories and descriptions for the logged-in user
    const expenseRecords = await db
      .select({
        category: expenses.category,
        description: expenses.description,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId));

    // Fetch income (orders) categories and descriptions for the logged-in user
    const orderRecords = await db
      .select({
        category: orders.category,
        description: orders.description,
      })
      .from(orders)
      .where(eq(orders.userId, userId));

    // Group descriptions under their unique categories
    const expensesMap: Record<string, string[]> = {};
    expenseRecords.forEach((record) => {
      const cat = record.category || "Other Expenses";
      const desc = record.description || "";
      
      if (!expensesMap[cat]) {
        expensesMap[cat] = [];
      }
      
      if (desc && !expensesMap[cat].includes(desc)) {
        expensesMap[cat].push(desc);
      }
    });

    const incomeMap: Record<string, string[]> = {};
    orderRecords.forEach((record) => {
      const cat = record.category || "order";
      const desc = record.description || "";
      
      if (!incomeMap[cat]) {
        incomeMap[cat] = [];
      }
      
      if (desc && !incomeMap[cat].includes(desc)) {
        incomeMap[cat].push(desc);
      }
    });

    return NextResponse.json({
      expenses: expensesMap,
      income: incomeMap
    });
  } catch (error) {
    console.error("Error fetching categories and descriptions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
