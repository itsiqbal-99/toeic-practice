export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
let session: Promise<unknown> | undefined;
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Establish one cookie before parallel dashboard queries create guest workspaces.
  if (!session) {
    const establish = () => request("/auth/me");
    session = (
      typeof navigator !== "undefined" && navigator.locks
        ? navigator.locks.request("toeic-session", establish)
        : establish()
    ).catch((error) => {
      session = undefined;
      throw error;
    });
    if (path === "/auth/me" && !options.method) return session as Promise<T>;
  }
  await session;
  return request<T>(path, options);
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/v1" + path, {
      ...options,
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Toeic-Client": "1",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Connection interrupted. Reconnect and retry. Unsynced answers remain in this browser.",
      0,
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      data?.error?.message ||
        "The request could not be completed. Please retry.",
      response.status,
    );
  return data as T;
}
export const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
export const timeLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.max(0, Math.floor(seconds % 60))).padStart(2, "0")}`;
