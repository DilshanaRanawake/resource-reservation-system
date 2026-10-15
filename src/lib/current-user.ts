import { cookies } from "next/headers";
import { z } from "zod";

export const currentUserCookie = "currentUserId";

export async function readCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const parsed = z.uuid().safeParse(store.get(currentUserCookie)?.value);
  return parsed.success ? parsed.data : null;
}

export function resolveCurrentUserId(
  users: ReadonlyArray<{ id: string }>,
  cookieUserId: string | null,
): string | null {
  if (cookieUserId && users.some((user) => user.id === cookieUserId)) {
    return cookieUserId;
  }

  return users[0]?.id ?? null;
}
