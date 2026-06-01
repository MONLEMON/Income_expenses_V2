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
