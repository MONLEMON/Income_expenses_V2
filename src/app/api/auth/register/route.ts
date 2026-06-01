import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcryptjs from "bcryptjs";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required").max(100),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = registerSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { username, password, fullName } = result.data;
    const normalizedUsername = username.toLowerCase().trim();

    // 1. Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // 2. Hash password with bcryptjs (100% serverless safe on Vercel)
    const passwordHash = await bcryptjs.hash(password, 10);

    // 3. Insert user into database
    await db.insert(users).values({
      username: normalizedUsername,
      passwordHash,
      fullName,
    });

    return NextResponse.json({ success: true, message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
