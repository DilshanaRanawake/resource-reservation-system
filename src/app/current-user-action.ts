"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { currentUserCookie } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function setCurrentUser(userId: string) {
  const parsed = z.uuid().safeParse(userId);
  if (!parsed.success) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });

  if (!user) {
    return;
  }

  const store = await cookies();
  store.set(currentUserCookie, user.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
}
