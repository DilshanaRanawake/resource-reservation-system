import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

export function getEnv() {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(message);
  }

  return parsed.data;
}
