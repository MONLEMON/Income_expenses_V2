import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import { verifyAuth } from "../../auth-helper";

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    // 1. Authorize session
    const decodedUser = verifyAuth(request);
    if (!decodedUser) {
      return NextResponse.json({ error: "Unauthorized: Session expired or invalid" }, { status: 401 });
    }

    const json = await request.json();
    const result = changePasswordSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { oldPassword, newPassword } = result.data;
    const userId = decodedUser.userId;

    // 2. Fetch user by userId
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (userRecords.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userRecords[0];

    // 3. Verify old password
    const isPasswordValid = await bcryptjs.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }

    // 4. Hash new password
    const newPasswordHash = await bcryptjs.hash(newPassword, 10);

    // 5. Update user password in database
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.userId, userId));

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
