import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Source_Sans_3 } from "next/font/google";
import { NavLinks } from "@/components/nav-links";
import { UserSwitcher } from "@/components/user-switcher";
import { Toaster } from "@/components/ui/sonner";
import { readCurrentUserId, resolveCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "Resource reservations",
  description: "Reserve rooms and equipment without overlapping bookings.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sourceSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#f3f4f6] text-[#1f2933]">
        <header className="bg-[#1e3a8a]">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex min-w-0 items-center justify-between gap-3 lg:contents">
              <Link href="/" className="shrink-0 text-lg font-semibold text-white">
                Reservations
              </Link>
              <div className="shrink-0 lg:order-last lg:ml-auto">
                <Suspense fallback={null}>
                  <CurrentUserMenu />
                </Suspense>
              </div>
            </div>
            <NavLinks />
          </nav>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}

async function CurrentUserMenu() {
  await connection();
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const currentId = resolveCurrentUserId(users, await readCurrentUserId());

  return <UserSwitcher users={users} currentId={currentId} />;
}
