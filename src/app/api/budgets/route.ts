import { NextResponse } from "next/server";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { verifyAuth } from "../auth-helper";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const decodedUser = verifyAuth(request);
    if (!decodedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = decodedUser.userId;

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return NextResponse.json({ error: "Month and Year are required" }, { status: 400 });
    }

    const budgetRecords = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.month, month), eq(budgets.year, year)));

    return NextResponse.json(budgetRecords);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const decodedUser = verifyAuth(request);
    if (!decodedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = decodedUser.userId;

    const json = await request.json();
    const schema = z.object({
      category: z.string().min(1),
      amount: z.number().positive(),
      month: z.string().length(2),
      year: z.string().length(4),
    });

    const result = schema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { category, amount, month, year } = result.data;

    // Check if budget already exists for this category/month/year
    const existing = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.category, category),
          eq(budgets.month, month),
          eq(budgets.year, year)
        )
      );

    if (existing.length > 0) {
      // Update
      await db
        .update(budgets)
        .set({ amount: amount.toString() })
        .where(eq(budgets.budgetId, existing[0].budgetId));
      return NextResponse.json({ success: true, message: "Budget updated" });
    } else {
      // Insert
      await db.insert(budgets).values({
        userId,
        category,
        amount: amount.toString(),
        month,
        year,
      });
      return NextResponse.json({ success: true, message: "Budget created" }, { status: 201 });
    }
  } catch (error) {
    console.error("Error saving budget:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const decodedUser = verifyAuth(request);
    if (!decodedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = decodedUser.userId;

    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get("id");
    if (!idStr) {
      return NextResponse.json({ error: "Budget ID is required" }, { status: 400 });
    }

    const budgetId = parseInt(idStr);
    if (isNaN(budgetId)) {
      return NextResponse.json({ error: "Invalid budget ID" }, { status: 400 });
    }

    await db
      .delete(budgets)
      .where(and(eq(budgets.budgetId, budgetId), eq(budgets.userId, userId)));

    return NextResponse.json({ success: true, message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
