// src/db/schema.ts
import { 
  pgTable, 
  serial, 
  integer, 
  varchar, 
  numeric, 
  boolean, 
  timestamp, 
  date, 
  text,
  pgSchema
} from "drizzle-orm/pg-core";

export const lbvSchema = pgSchema("LBV");

// 0. ตาราง ผู้ใช้งาน (Users)
export const users = lbvSchema.table("users", {
  userId: serial("user_id").primaryKey(),
  username: varchar("username", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 1. ตาราง หมวดหมู่ (Categories)
export const categories = lbvSchema.table("categories", {
  categoryId: serial("category_id").primaryKey(),
  categoryName: varchar("category_name", { length: 255 }).notNull(),
});

// 2. ตาราง เมนูอาหาร/สินค้า (Menu Items)
export const menuItems = lbvSchema.table("menu_items", {
  menuId: serial("menu_id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.categoryId),
  menuName: varchar("menu_name", { length: 255 }).notNull(),
  price: numeric("price").notNull(),
  isAvailable: boolean("is_available").default(true),
});

// 3. ตาราง ข้อมูลคำสั่งซื้อ (Orders)
export const orders = lbvSchema.table("orders", {
  orderId: serial("order_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  totalAmount: numeric("total_amount").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  category: varchar("category", { length: 255 }).default("order"),
  description: text("description"),
});

// 4. ตาราง รายการในคำสั่งซื้อ (Order Items)
export const orderItems = lbvSchema.table("order_items", {
  orderItemId: serial("order_item_id").primaryKey(),
  orderId: integer("order_id").references(() => orders.orderId).notNull(),
  menuId: integer("menu_id").references(() => menuItems.menuId).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
});

// 5. ตาราง รายจ่าย (Expenses)
export const expenses = lbvSchema.table("expenses", {
  expenseId: serial("expense_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId),
  expenseDate: date("expense_date").notNull(),
  category: varchar("category", { length: 255 }),
  description: text("description"),
  amount: numeric("amount").notNull(),
  quantity: numeric("quantity"),
  unit: varchar("unit", { length: 50 }),
});

// 6. ตาราง งบประมาณ (Budgets)
export const budgets = lbvSchema.table("budgets", {
  budgetId: serial("budget_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId),
  category: varchar("category", { length: 255 }).notNull(),
  amount: numeric("amount").notNull(),
  period: varchar("period", { length: 50 }).default("monthly").notNull(),
  month: varchar("month", { length: 2 }).notNull(),
  year: varchar("year", { length: 4 }).notNull(),
});

// 7. ตาราง เป้าหมายการออมเงิน (Savings Goals)
export const savingsGoals = lbvSchema.table("savings_goals", {
  goalId: serial("goal_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: numeric("target_amount").notNull(),
  currentAmount: numeric("current_amount").default("0"),
  targetDate: date("target_date"),
  createdAt: timestamp("created_at").defaultNow(),
});
