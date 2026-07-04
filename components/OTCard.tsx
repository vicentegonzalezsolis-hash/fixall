"use client";

import Link from "next/link";
import EstadoBadge from "./EstadoBadge";
import { OrdenTrabajo } from "@/types/database";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "hace unos min.";
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export default function OTCard({ ot }: { ot: OrdenTrabajo }) {
  const v = ot.vehiculo;

  return (
    <Link
      href={`/ot/${ot.id}`}
      className="block rounded-2xl active:scale-[0.98] transition-all"
      style={{
        background: "#111827",
        border: "1px solid #1a2a3a",
      }}
    >
      <div className="pl-4 pr-4 pt-4 pb-3.5">
        {/* Fila superior */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-base font-extrabold tracking-wide"
                style={{ color: "#FAFAFA", fontFamily: "monospace" }}
              >
                {v?.patente ?? "—"}
              </span>
              {v && (
                <span className="text-xs" style={{ color: "#555555" }}>
                  {v.marca} {v.modelo}
                  {v.anio ? ` ${v.anio}` : ""}
                </span>
              )}
            </div>
            {v?.cliente_nombre && (
              <p className="text-xs mt-0.5" style={{ color: "#555555" }}>
                {v.cliente_nombre}
              </p>
            )}
          </div>
          <EstadoBadge estado={ot.estado} />
        </div>

        {/* Descripción */}
        <p className="text-xs line-clamp-1 mb-3" style={{ color: "#555555" }}>
          {ot.descripcion_problema}
        </p>

        {/* Fila inferior */}
        <div
          className="flex items-center justify-between pt-2.5"
          style={{ borderTop: "1px solid #1a2a3a" }}
        >
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#555555" strokeWidth="1"/>
              <path d="M6 3.5V6l1.5 1.5" stroke="#555555" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px]" style={{ color: "#555555" }}>
              {timeAgo(ot.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {ot.aprobado_por_cliente && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                ✓ Aprobado
              </span>
            )}
            <span className="text-sm font-bold" style={{ color: ot.monto_total > 0 ? "#FAFAFA" : "#555555" }}>
              {ot.monto_total > 0 ? formatCLP(ot.monto_total) : "Sin presupuesto"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
