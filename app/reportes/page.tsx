import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import GraficoBarras from "./GraficoBarras";
import AppHeader from "@/components/AppHeader";

function formatCLPShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}


export default async function ReportesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: taller } = await supabase
    .from("talleres")
    .select("id, nombre")
    .eq("user_id", user.id)
    .single();
  if (!taller) redirect("/perfil");

  const now = new Date();
  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Una sola query: últimos 6 meses completos
  const inicio6Meses = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

  const { data: todasOTs } = await supabase
    .from("ordenes_trabajo")
    .select("monto_total, estado, aprobado_por_cliente, created_at")
    .eq("taller_id", taller.id)
    .gte("created_at", inicio6Meses)
    .order("created_at", { ascending: true });

  const rows = todasOTs ?? [];

  // Agrupar por mes en JS
  const mapasMeses = new Map<string, { ingresos: number; ots: number }>();

  // Inicializar los 6 slots vacíos
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`; // ej. "2025-4"
    mapasMeses.set(key, { ingresos: 0, ots: 0 });
  }

  for (const ot of rows) {
    const d = new Date(ot.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const slot = mapasMeses.get(key);
    if (slot) {
      slot.ingresos += ot.monto_total || 0;
      slot.ots += 1;
    }
  }

  // Construir array ordenado para el gráfico
  const mesesData = Array.from(mapasMeses.entries()).map(([key, val]) => {
    const [year, month] = key.split("-").map(Number);
    return { label: MESES[month], ingresos: val.ingresos, ots: val.ots };
  });

  // Stats mes actual y mes anterior (ya los tenemos de todasOTs)
  const mesActualRows = rows.filter((o) => {
    const d = new Date(o.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const mesPasadoRows = rows.filter((o) => {
    const d = new Date(o.created_at);
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
  });

  const ingresosMes = mesActualRows.reduce((s, o) => s + (o.monto_total || 0), 0);
  const ingresosPasado = mesPasadoRows.reduce((s, o) => s + (o.monto_total || 0), 0);
  const ticketPromedio =
    mesActualRows.length > 0 ? Math.round(ingresosMes / mesActualRows.length) : 0;
  const aprobadas = mesActualRows.filter((o) => o.aprobado_por_cliente).length;
  const cerradas = mesActualRows.filter((o) => o.estado === "cerrado").length;
  const crecimiento =
    ingresosPasado > 0
      ? Math.round(((ingresosMes - ingresosPasado) / ingresosPasado) * 100)
      : null;

  const estadosChart = [
    { label: "Pendiente",     count: mesActualRows.filter((o) => o.estado === "pendiente").length,          color: "#67BAF4" },
    { label: "En proceso",    count: mesActualRows.filter((o) => o.estado === "en_proceso").length,         color: "#F59E0B" },
    { label: "Esp. repuesto", count: mesActualRows.filter((o) => o.estado === "esperando_repuesto").length, color: "#F59E0B" },
    { label: "Listo",         count: mesActualRows.filter((o) => o.estado === "listo").length,              color: "#10B981" },
    { label: "Cerrado",       count: cerradas,                                                               color: "#555555" },
  ];

  const mesNombre = MESES[now.getMonth()];
  const mesPrevNombre = MESES[now.getMonth() === 0 ? 11 : now.getMonth() - 1];

  return (
    <div className="pb-28 min-h-screen" style={{ background: "#0D0D0D" }}>
      <AppHeader tallerNombre={taller.nombre} />
      {/* Header */}
      <div className="px-4 pt-3 pb-5">
        <h1 className="text-xl font-extrabold" style={{ color: "#FAFAFA" }}>Reportes</h1>
        <p className="text-sm mt-0.5" style={{ color: "#555555" }}>
          {mesNombre} {now.getFullYear()}
        </p>
      </div>

      <div className="px-4 space-y-4">

        {/* ── INGRESOS MES ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#1E466B" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "#67BAF4" }}
          >
            Ingresos del mes
          </p>
          <p className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: "#FAFAFA" }}>
            {formatCLP(ingresosMes)}
          </p>
          {crecimiento !== null && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className="text-sm font-bold"
                style={{ color: crecimiento >= 0 ? "#10B981" : "#EF4444" }}
              >
                {crecimiento >= 0 ? "↑" : "↓"} {Math.abs(crecimiento)}%
              </span>
              <span className="text-xs" style={{ color: "rgba(103,186,244,0.7)" }}>
                vs {mesPrevNombre} ({formatCLPShort(ingresosPasado)})
              </span>
            </div>
          )}
        </div>

        {/* ── GRÁFICO 6 MESES ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#111827", border: "1px solid #1a2a3a" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#555555" }}
          >
            Ingresos — últimos 6 meses
          </p>
          <GraficoBarras data={mesesData} />
        </div>

        {/* ── MINI STATS ── */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "OTs del mes",      value: mesActualRows.length, color: "#67BAF4", fmt: "num" },
            { label: "Ticket promedio",  value: ticketPromedio,       color: "#FAFAFA", fmt: "clp" },
            { label: "Aprobadas online", value: aprobadas,            color: "#10B981", fmt: "num" },
            { label: "Cerradas",         value: cerradas,             color: "#555555", fmt: "num" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4"
              style={{ background: "#111827", border: "1px solid #1a2a3a" }}
            >
              <p className="text-xs mb-1.5" style={{ color: "#555555" }}>
                {s.label}
              </p>
              <p
                className="font-extrabold leading-none tabular-nums"
                style={{ color: s.color, fontSize: s.fmt === "clp" ? 18 : 28 }}
              >
                {s.fmt === "clp" ? formatCLPShort(s.value) : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── DISTRIBUCIÓN ESTADOS ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#111827", border: "1px solid #1a2a3a" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#555555" }}
          >
            Distribución por estado
          </p>
          <div className="space-y-3">
            {estadosChart.map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "#555555" }}>{row.label}</span>
                  <span className="font-bold" style={{ color: row.color }}>
                    {row.count}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "#1a2a3a" }}
                >
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width:
                        mesActualRows.length > 0
                          ? `${(row.count / mesActualRows.length) * 100}%`
                          : "0%",
                      background: row.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
