import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/review", label: "Mistakes" },
  { href: "/mock", label: "Mock Exam" },
];

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell-bg">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel rounded-[2rem] p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-accent text-xs font-semibold uppercase tracking-[0.28em]">
                ITPEC IP Exam Reviewer
              </p>
              <div className="space-y-2">
                <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
                  {title}
                </h1>
                <p className="text-muted max-w-2xl text-sm leading-6 sm:text-base">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <nav className="flex flex-wrap gap-3">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="nav-pill rounded-full px-4 py-2 text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
