import Link from "next/link";
import type { ReactNode } from "react";

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_26%),linear-gradient(180deg,_#030712,_#07111d_38%,_#0b1728_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                ITPEC IP Exam Reviewer
              </p>
              <div className="space-y-2">
                <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  {description}
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-amber-300/60 hover:bg-white/12"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
