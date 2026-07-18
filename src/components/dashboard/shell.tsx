"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  CirclePlus,
  Compass,
  Gavel,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

function navItems(role: SessionUser["role"]): NavItem[] {
  const base: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  ];
  if (role === "client") {
    base.push(
      { href: "/dashboard/jobs", label: "My Jobs", icon: Briefcase, exact: true },
      { href: "/dashboard/jobs/new", label: "Post a Job", icon: CirclePlus, exact: true },
    );
  } else {
    base.push(
      { href: "/dashboard/jobs", label: "Find Jobs", icon: Compass },
      { href: "/dashboard/bids", label: "My Bids", icon: Gavel, exact: true },
    );
  }
  base.push({ href: "/dashboard/profile", label: "Profile", icon: UserRound, exact: true });
  return base;
}

function isActive(pathname: string, item: NavItem, all: NavItem[]): boolean {
  if (item.exact) return pathname === item.href;
  if (pathname === item.href) return true;
  if (!pathname.startsWith(item.href)) return false;
  // don't highlight a prefix item when an exact sibling matches
  return !all.some((o) => o !== item && o.exact && pathname.startsWith(o.href) && o.href !== item.href);
}

function SidebarContent({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navItems(user.role);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  return (
    <div className="flex h-full flex-col bg-night">
      <div className="flex h-16 shrink-0 items-center border-b border-night-line px-5">
        <Link href="/" onClick={onNavigate}>
          <Logo dark />
        </Link>
      </div>

      <div className="px-5 pb-2 pt-5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset",
            user.role === "professional"
              ? "bg-gold/10 text-gold ring-gold/25"
              : "bg-brand/15 text-brand ring-brand/30",
          )}
        >
          {user.role === "professional" ? "Professional" : "Client"}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {items.map((item) => {
          const active = isActive(pathname, item, items);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-cream/[0.08] text-cream ring-1 ring-inset ring-cream/10"
                  : "text-cream/60 hover:bg-cream/[0.04] hover:text-cream/85",
              )}
            >
              <item.icon
                className={cn(
                  "size-[18px] transition-colors",
                  active ? "text-brand" : "text-cream/40 group-hover:text-cream/70",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-night-line p-4">
        <div className="flex items-center gap-3 rounded-xl bg-cream/[0.05] p-3 ring-1 ring-inset ring-cream/[0.07]">
          <Avatar name={user.name} hue={user.avatarHue} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-cream">{user.name}</p>
            <p className="truncate text-[11px] text-cream/60">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg p-2 text-cream/40 transition-colors hover:bg-cream/10 hover:text-cream"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile topbar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-night-line bg-night px-4 lg:hidden">
        <Logo dark />
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-cream/70 transition-colors hover:bg-cream/10 hover:text-cream"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-night/60 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.12 }}
              className="absolute inset-y-0 left-0 w-72"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute -right-11 top-4 rounded-lg p-2 text-cream/80 hover:bg-cream/10"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
              <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
