import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, expenses } from "@/db/schema";
import { desc, sql, and, eq } from "drizzle-orm";
import { z } from "zod";
import { verifyAuth } from "../auth-helper";

// Tailwind indicator background classes matching CATEGORIES
const CATEGORY_BG_CLASSES: Record<string, string> = {
  'order': 'bg-emerald-700',
  'Salary': 'bg-emerald-700',
  'Freelance': 'bg-teal-600',
  'Investments': 'bg-emerald-500',
  'Other Income': 'bg-emerald-400',
  'Food & Dining': 'bg-emerald-900',
  'food': 'bg-emerald-900',
  'food & dining': 'bg-emerald-900',
  'Shopping': 'bg-emerald-500',
  'shopping': 'bg-emerald-500',
  'Transportation': 'bg-teal-600',
  'transportation': 'bg-teal-600',
  'Entertainment': 'bg-lime-500',
  'entertainment': 'bg-lime-500',
  'Bills & Utilities': 'bg-lime-700',
  'bills & utilities': 'bg-lime-700',
  'Other Expenses': 'bg-emerald-300',
  'other': 'bg-emerald-300',
  'ohter': 'bg-emerald-300',
  'other expenses': 'bg-emerald-300',
  'drink': 'bg-sky-500',
  'sevice': 'bg-violet-500',
  'service': 'bg-violet-500',
  'all': 'bg-pink-500'
};

const transactionsQuerySchema = z.object({
  month: z.string().regex(/^(0[1-9]|1[0-2]|ALL)$/).optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
});

const createTransactionSchema = z.object({
  item: z.string().min(1, "Description is required"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
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
    const rawMonth = searchParams.get("month") || undefined;
    const rawYear = searchParams.get("year") || undefined;

    const parseResult = transactionsQuerySchema.safeParse({ month: rawMonth, year: rawYear });
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { month, year } = parseResult.data;

    // Build conditions
    const orderConditions: any[] = [eq(orders.userId, userId)];
    const expenseConditions: any[] = [eq(expenses.userId, userId)];

    if (year) {
      orderConditions.push(sql`to_char(${orders.orderDate}, 'YYYY') = ${year}`);
      expenseConditions.push(sql`to_char(${expenses.expenseDate}, 'YYYY') = ${year}`);
    }

    if (month && month !== "ALL") {
      orderConditions.push(sql`to_char(${orders.orderDate}, 'MM') = ${month}`);
      expenseConditions.push(sql`to_char(${expenses.expenseDate}, 'MM') = ${month}`);
    }

    // 3. Fetch Orders (Income)
    let ordersQuery = db
      .select({
        id: orders.orderId,
        date: orders.orderDate,
        amount: orders.totalAmount,
        paymentMethod: orders.paymentMethod,
        category: orders.category,
        description: orders.description,
      })
      .from(orders);

    if (orderConditions.length > 0) {
      ordersQuery = ordersQuery.where(and(...orderConditions)) as any;
    }
    const orderRecords = await ordersQuery.orderBy(desc(orders.orderDate));

    // 4. Fetch Expenses
    let expensesQuery = db
      .select({
        id: expenses.expenseId,
        date: expenses.expenseDate,
        amount: expenses.amount,
        category: expenses.category,
        description: expenses.description,
      })
      .from(expenses);

    if (expenseConditions.length > 0) {
      expensesQuery = expensesQuery.where(and(...expenseConditions)) as any;
    }
    const expenseRecords = await expensesQuery.orderBy(desc(expenses.expenseDate));

    // 5. Normalize and merge records
    const allTx = [
      ...orderRecords.map((o) => {
        const oDate = new Date(o.date);
        const day = String(oDate.getDate()).padStart(2, "0");
        const mn = String(oDate.getMonth() + 1).padStart(2, "0");
        const yr = oDate.getFullYear();
        const dateStr = `${day}/${mn}/${yr}`;
        
        return {
          id: `income-${o.id}`,
          date: dateStr,
          timestamp: oDate.getTime(),
          item: o.description || (o.paymentMethod ? `POS Order (${o.paymentMethod})` : "Sales Revenue"),
          type: "Income",
          category: o.category || "order",
          amount: parseFloat(o.amount) || 0,
        };
      }),
      ...expenseRecords.map((e) => {
        const [yr, mn, dy] = e.date.split("-").map(Number);
        const localDate = new Date(yr, mn - 1, dy);
        
        const day = String(dy).padStart(2, "0");
        const monthStr = String(mn).padStart(2, "0");
        const dateStr = `${day}/${monthStr}/${yr}`;

        return {
          id: `expense-${e.id}`,
          date: dateStr,
          timestamp: localDate.getTime(),
          item: e.description || "Expense Transaction",
          type: "Expense",
          category: e.category || "Other Expenses",
          amount: -(parseFloat(e.amount) || 0),
        };
      }),
    ];

    // Sort descending by timestamp
    allTx.sort((a, b) => b.timestamp - a.timestamp);

    // Calculate dynamic contributions
    const totalExpenses = Math.abs(allTx
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
      
    const totalIncome = allTx
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const formattedTxList = allTx.map((t) => {
      let pct = "0%";
      if (t.amount < 0 && totalExpenses > 0) {
        pct = ((Math.abs(t.amount) / totalExpenses) * 100).toFixed(1) + "%";
      } else if (t.amount > 0 && totalIncome > 0) {
        pct = ((t.amount / totalIncome) * 100).toFixed(1) + "%";
      }
      return {
        ...t,
        contribution: pct,
        color: CATEGORY_BG_CLASSES[t.category] || CATEGORY_BG_CLASSES[t.category.toLowerCase()] || "bg-emerald-500",
      };
    });

    return NextResponse.json(formattedTxList);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authorize session
    const decodedUser = verifyAuth(request);
    if (!decodedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decodedUser.userId;

    // 2. Parse body
    const json = await request.json();
    const result = createTransactionSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { item, type, category, amount, date } = result.data;

    // 3. Save to database
    if (type === "income") {
      await db.insert(orders).values({
        userId,
        orderDate: new Date(date),
        totalAmount: amount.toString(),
        paymentMethod: "Cash",
        category,
        description: item,
      });
    } else {
      await db.insert(expenses).values({
        userId,
        expenseDate: date,
        category,
        description: item,
        amount: amount.toString(),
      });
    }

    return NextResponse.json({ success: true, message: "Transaction added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
