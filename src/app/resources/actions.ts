"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  type ActionState,
  resourceSchema,
  zodFieldErrors,
} from "@/lib/validation";

function revalidateResourcePages() {
  revalidatePath("/resources");
  revalidatePath("/reservations/new");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function createResource(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resourceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error) };
  }

  await prisma.resource.create({
    data: { name: parsed.data.name },
  });

  revalidateResourcePages();
  return { success: "Resource created." };
}

export async function updateResource(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = resourceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!id.success) {
    return { formError: "Resource not found." };
  }

  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    await prisma.resource.update({
      where: { id: id.data },
      data: { name: parsed.data.name },
    });
  } catch (error) {
    if (isMissingRecord(error)) {
      return { formError: "Resource not found." };
    }
    throw error;
  }

  revalidateResourcePages();
  return { success: "Resource saved." };
}

export async function setResourceActive(id: string, active: boolean) {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) {
    return;
  }

  try {
    await prisma.resource.update({
      where: { id: parsedId.data },
      data: { active },
    });
  } catch (error) {
    if (isMissingRecord(error)) {
      return;
    }
    throw error;
  }

  revalidateResourcePages();
}

function isMissingRecord(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}
