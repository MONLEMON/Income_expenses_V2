import { NextResponse } from "next/server";
import { db } from "@/db";
import { savingsGoals } from "@/db/schema";
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

    const goals = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId));

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching savings goals:", error);
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
      name: z.string().min(1),
      targetAmount: z.number().positive(),
      currentAmount: z.number().nonnegative().optional(),
      targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    });

    const result = schema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, targetAmount, currentAmount = 0, targetDate } = result.data;

    await db.insert(savingsGoals).values({
      userId,
      name,
      targetAmount: targetAmount.toString(),
      currentAmount: currentAmount.toString(),
      targetDate: targetDate || null,
    });

    return NextResponse.json({ success: true, message: "Savings goal created" }, { status: 201 });
  } catch (error) {
    console.error("Error saving savings goal:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const decodedUser = verifyAuth(request);
    if (!decodedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = decodedUser.userId;

    const json = await request.json();
    const schema = z.object({
      goalId: z.number(),
      amountToAdd: z.number(),
    });

    const result = schema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { goalId, amountToAdd } = result.data;

    // Fetch existing goal
    const existing = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.goalId, goalId), eq(savingsGoals.userId, userId)));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const newAmount = (parseFloat(existing[0].currentAmount || "0") + amountToAdd);

    await db
      .update(savingsGoals)
      .set({ currentAmount: Math.max(0, newAmount).toString() })
      .where(eq(savingsGoals.goalId, goalId));

    return NextResponse.json({ success: true, message: "Goal updated successfully" });
  } catch (error) {
    console.error("Error updating goal:", error);
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
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
    }

    const goalId = parseInt(idStr);
    if (isNaN(goalId)) {
      return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
    }

    await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.goalId, goalId), eq(savingsGoals.userId, userId)));

    return NextResponse.json({ success: true, message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
