import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "pos-premium-jwt-secret-key-2026";

export interface DecodedUser {
  userId: number;
  username: string;
  fullName: string;
}

export function verifyAuth(request: Request): DecodedUser | null {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as DecodedUser;
    
    if (!payload || !payload.userId) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("JWT Verification error:", error);
    return null;
  }
}

export function unauthorizedResponse(message = "Unauthorized: Session expired or invalid") {
  return new Response(JSON.stringify({ error: message, code: "UNAUTHORIZED" }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
