"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="12" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="2" y="12" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="12" y="12" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    href: "/patentes",
    label: "Vehículos",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 13l2-6h12l2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <rect x="2" y="13" width="18" height="5" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="6" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="16" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: "/ot/nueva",
    label: "",
    icon: null,
    isAdd: true,
  },
  {
    href: "/inventario",
    label: "Stock",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 7h14M4 11h14M4 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <rect x="2" y="3" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 18V12M9 18V8M14 18V10M19 18V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-surface border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {NAV.map((item) => {
          if (item.isAdd) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95 transition-transform">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </Link>
            );
          }
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                active ? "text-primary" : "text-text-muted"
              }`}
            >
              {item.icon}
              {item.label && (
                <span className="text-[10px] font-semibold">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
