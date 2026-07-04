"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Car, Plus, Boxes, BarChart3 } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Inicio", Icon: LayoutGrid },
  { href: "/patentes", label: "Vehículos", Icon: Car },
  { href: "/ot/nueva", label: "", Icon: null, isAdd: true },
  { href: "/inventario", label: "Stock", Icon: Boxes },
  { href: "/reportes", label: "Reportes", Icon: BarChart3 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-50"
      style={{
        background: "#0D0D0D",
        borderTop: "1px solid #1a1a1a",
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-5">
        {NAV.map((item) => {
          if (item.isAdd) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-5">
                <div
                  className="flex items-center justify-center active:scale-95 transition-transform"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: "#1E466B",
                    border: "1px solid #67BAF4",
                  }}
                >
                  <Plus size={22} color="#67BAF4" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }

          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.Icon!;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors"
              style={{ color: active ? "#67BAF4" : "#555555" }}
            >
              <Icon size={22} strokeWidth={1.8} />
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
