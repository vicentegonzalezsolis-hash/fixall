"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="2" width="8" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="12" y="2" width="8" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="2" y="12" width="8" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="12" y="12" width="8" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    href: "/patentes",
    label: "Vehículos",
    icon: (
      // Lucide "Car" icon
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17H5v2a1 1 0 001 1h12a1 1 0 001-1v-2z" />
        <path d="M5 17l-1.5-6h15L17 17" />
        <path d="M8 11l1.5-5h5L16 11" />
        <circle cx="7.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
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
        <rect x="3" y="2" width="16" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M7 7h8M7 11h8M7 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 18V13M7.5 18V9M12 18V11M16.5 18V6M20 18H2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-50"
      style={{
        background: "rgba(12,14,22,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-5">
        {NAV.map((item) => {
          if (item.isAdd) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-5">
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
                  style={{
                    width: 52,
                    height: 52,
                    background: "linear-gradient(135deg, #1A6BFF 0%, #0052e0 100%)",
                    boxShadow: "0 4px 20px rgba(26,107,255,0.4), 0 0 0 4px rgba(26,107,255,0.1)",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 3v14M3 10h14"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </Link>
            );
          }

          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors"
              style={{ color: active ? "#1A6BFF" : "rgba(255,255,255,0.3)" }}
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
