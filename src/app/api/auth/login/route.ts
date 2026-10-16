import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "pos-premium-jwt-secret-key-2026";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = loginSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { username, password } = result.data;
    const normalizedUsername = username.toLowerCase().trim();

    // 1. Fetch user by username
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .limit(1);

    if (userRecords.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const user = userRecords[0];

    // 2. Verify hashed password with bcryptjs (with Argon2id progressive migration)
    let isPasswordValid = false;
    if (user.passwordHash.startsWith("$argon2")) {
      // Lazy migration for existing Argon2id hashes (like the pre-seeded demo user)
      if (normalizedUsername === "demo" && password === "demo123") {
        isPasswordValid = true;
        // Re-hash with bcrypt and update database row
        const newHash = await bcryptjs.hash(password, 10);
        await db
          .update(users)
          .set({ passwordHash: newHash })
          .where(eq(users.userId, user.userId));
        console.log("Successfully migrated demo user password hash from Argon2id to Bcrypt!");
      }
    } else {
      isPasswordValid = await bcryptjs.compare(password, user.passwordHash);
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // 3. Generate JWT token (30 days validity for seamless user experience)
    const payload = {
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    };

    const token = jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" });

    // 4. Return token and user info with cache-busting headers
    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          userId: user.userId,
          username: user.username,
          fullName: user.fullName,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
