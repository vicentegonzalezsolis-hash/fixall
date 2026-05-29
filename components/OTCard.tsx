"use client";

import Link from "next/link";
import EstadoBadge from "./EstadoBadge";
import { OrdenTrabajo } from "@/types/database";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "hace unos minutos";
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

export default function OTCard({ ot }: { ot: OrdenTrabajo }) {
  const v = ot.vehiculo;
  return (
    <Link href={`/ot/${ot.id}`} className="block card hover:border-border/50 active:scale-[0.98] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs text-text-muted font-mono">OT #{ot.numero_ot}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base font-bold text-white">{v?.patente ?? "—"}</span>
            {v && (
              <span className="text-sm text-text-secondary">
                {v.marca} {v.modelo}
              </span>
            )}
          </div>
        </div>
        <EstadoBadge estado={ot.estado} />
      </div>

      <p className="text-sm text-text-secondary line-clamp-1 mb-3">{ot.descripcion_problema}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{timeAgo(ot.created_at)}</span>
        <div className="flex items-center gap-2">
          {ot.aprobado_por_cliente && (
            <span className="text-xs text-success font-semibold">✓ Aprobado</span>
          )}
          <span className="text-sm font-bold text-white">{formatCLP(ot.monto_total)}</span>
        </div>
      </div>
    </Link>
  );
}
