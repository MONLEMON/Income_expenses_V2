import { NextResponse } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
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

    // 2. Fetch categories and descriptions for the logged-in user
    const expenseRecords = await db
      .select({
        category: expenses.category,
        description: expenses.description,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId));

    // Group descriptions under their unique categories
    const mapping: Record<string, string[]> = {};
    
    expenseRecords.forEach((record) => {
      const cat = record.category || "Other Expenses";
      const desc = record.description || "";
      
      if (!mapping[cat]) {
        mapping[cat] = [];
      }
      
      if (desc && !mapping[cat].includes(desc)) {
        mapping[cat].push(desc);
      }
    });

    return NextResponse.json(mapping);
  } catch (error) {
    console.error("Error fetching categories and descriptions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
