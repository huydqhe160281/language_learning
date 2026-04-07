"use client";

import Link from "next/link";

const nav: { href: string; key: string; label: string }[] = [
  { href: "/dashboard", key: "home", label: "Home" },
  { href: "/dashboard/sets", key: "sets", label: "My Sets" },
  { href: "/dashboard/progress", key: "progress", label: "Progress" },
];

export function DashboardShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "home" | "sets" | "progress";
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            LinguaLearn
          </Link>
        </div>
      </header>
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8 py-4">
            {nav.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={
                  active === item.key
                    ? "border-b-2 border-blue-600 pb-2 font-medium text-blue-600"
                    : "pb-2 text-gray-600 hover:text-gray-900"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
