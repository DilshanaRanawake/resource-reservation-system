"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/resources", label: "Resources" },
  { href: "/reservations", label: "Reservations" },
  { href: "/calendar", label: "Calendar" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center">
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "justify-self-center border-b-2 border-transparent px-2 py-2 text-center text-sm font-semibold whitespace-nowrap text-white/80 hover:text-[#c4a35a] lg:justify-self-auto lg:px-3 lg:text-left",
              active && "border-[#c4a35a] text-white",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
