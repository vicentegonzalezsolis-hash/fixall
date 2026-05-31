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

const ESTADO_ACCENT: Record<string, string> = {
  pendiente: "#FFB020",
  en_proceso: "#1A6BFF",
  esperando_repuesto: "#FFB020",
  listo: "#00D68F",
  cerrado: "rgba(255,255,255,0.15)",
};

export default function OTCard({ ot }: { ot: OrdenTrabajo }) {
  const v = ot.vehiculo;
  const accent = ESTADO_ACCENT[ot.estado] ?? "rgba(255,255,255,0.1)";

  return (
    <Link
      href={`/ot/${ot.id}`}
      className="block relative overflow-hidden rounded-2xl active:scale-[0.98] transition-all"
      style={{
        background: "linear-gradient(145deg, rgba(26,29,46,0.9) 0%, rgba(18,20,31,0.95) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}
    >
      {/* Línea de acento izquierda según estado */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl"
        style={{ background: accent }}
      />

      <div className="pl-4 pr-4 pt-4 pb-3.5">
        {/* Fila superior */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-base font-extrabold tracking-wide"
                style={{ color: "#fff", fontFamily: "monospace" }}
              >
                {v?.patente ?? "—"}
              </span>
              {v && (
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {v.marca} {v.modelo}
                  {v.anio ? ` ${v.anio}` : ""}
                </span>
              )}
            </div>
            {v?.cliente_nombre && (
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {v.cliente_nombre}
              </p>
            )}
          </div>
          <EstadoBadge estado={ot.estado} />
        </div>

        {/* Descripción */}
        <p className="text-xs line-clamp-1 mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
          {ot.descripcion_problema}
        </p>

        {/* Fila inferior */}
        <div
          className="flex items-center justify-between pt-2.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
              <path d="M6 3.5V6l1.5 1.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>
              {timeAgo(ot.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {ot.aprobado_por_cliente && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                style={{ background: "rgba(0,214,143,0.1)", color: "#00D68F", border: "1px solid rgba(0,214,143,0.2)" }}
              >
                ✓ Aprobado
              </span>
            )}
            <span className="text-sm font-bold" style={{ color: ot.monto_total > 0 ? "#fff" : "rgba(255,255,255,0.3)" }}>
              {ot.monto_total > 0 ? formatCLP(ot.monto_total) : "Sin presupuesto"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
