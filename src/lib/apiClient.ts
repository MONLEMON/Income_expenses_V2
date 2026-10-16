import { useAuthStore, isTokenExpired } from "@/hooks/useAuthStore";

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Robust fetch wrapper that attaches Bearer token,
 * prevents stale caching, and automatically logs out when receiving 401 Unauthorized.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = useAuthStore.getState().token;

  // If token is already expired client-side, clear auth immediately
  if (token && isTokenExpired(token)) {
    useAuthStore.getState().logout();
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  const headers = new Headers(options.headers || {});

  // Prevent browser caching on authenticated API requests
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-cache");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Intercept 401 Unauthorized
  if (response.status === 401) {
    useAuthStore.getState().logout();
    let errorMsg = "Session expired. Please log in again.";
    try {
      const cloned = response.clone();
      const errJson = await cloned.json();
      if (errJson?.error) {
        errorMsg = errJson.error;
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiError(errorMsg, 401);
  }

  return response;
}
