"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

export function SidebarNavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/80 hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon name={icon} className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
