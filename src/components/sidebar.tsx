import Image from "next/image";
import Link from "next/link";
import { brand } from "../../config/brand";
import { SidebarNavLink } from "./sidebar-nav-link";
import { SignOutButton } from "./sign-out-button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/clients", label: "Clients", icon: "users" },
  { href: "/leads", label: "Leads & Onboarding", icon: "funnel" },
  { href: "/tasks", label: "Tasks", icon: "check" },
  { href: "/capacity", label: "Capacity Planner", icon: "clock" },
  { href: "/notes", label: "Notes", icon: "note" },
  { href: "/invoices", label: "Invoices", icon: "invoice" },
  { href: "/expenses", label: "Expenses", icon: "expense" },
  { href: "/docs", label: "Docs Hub", icon: "doc" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export function Sidebar({ userName, userImage }: { userName?: string | null; userImage?: string | null }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <Link href="/dashboard" className="flex items-center gap-2 border-b border-border px-5 py-5">
        <Image src={brand.logo.src} alt={brand.logo.alt} width={brand.logo.width} height={brand.logo.height} />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-card-foreground">{brand.businessName}</div>
          <div className="text-xs text-muted-foreground">{brand.tagline}</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <SidebarNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-border px-4 py-4">
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userImage} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-card-foreground">{userName ?? "Signed in"}</div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
