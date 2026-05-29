import { EstadoOT } from "@/types/database";

const ESTADO_CONFIG: Record<EstadoOT, { label: string; color: string; bg: string }> = {
  pendiente:          { label: "Pendiente",          color: "text-warning",  bg: "bg-warning-dim" },
  en_proceso:         { label: "En proceso",         color: "text-primary",  bg: "bg-primary-dim" },
  esperando_repuesto: { label: "Esp. repuesto",      color: "text-warning",  bg: "bg-warning-dim" },
  listo:              { label: "Listo",              color: "text-success",  bg: "bg-success-dim" },
  cerrado:            { label: "Cerrado",            color: "text-text-secondary", bg: "bg-surface-2" },
};

export default function EstadoBadge({ estado }: { estado: EstadoOT }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.pendiente;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace("text-", "bg-")}`} />
      {cfg.label}
    </span>
  );
}
