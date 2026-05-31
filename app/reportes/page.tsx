import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import GraficoBarras from "./GraficoBarras";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatCLPShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export default async function ReportesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: taller } = await supabase
    .from("talleres")
    .select("id, nombre")
    .eq("user_id", user.id)
    .single();
  if (!taller) redirect("/perfil");

  const now = new Date();
  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Últimos 6 meses de datos para el gráfico
  const mesesData: { label: string; ingresos: number; ots: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from("ordenes_trabajo")
      .select("monto_total")
      .eq("taller_id", taller.id)
      .gte("created_at", inicio)
      .lte("created_at", fin);
    const total = (data ?? []).reduce((s, o) => s + (o.monto_total || 0), 0);
    mesesData.push({ label: MESES[d.getMonth()], ingresos: total, ots: (data ?? []).length });
  }

  // Stats mes actual
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const inicioMesPasado = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const finMesPasado = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const [{ data: otsMes }, { data: otsPasado }] = await Promise.all([
    supabase
      .from("ordenes_trabajo")
      .select("monto_total, estado, aprobado_por_cliente")
      .eq("taller_id", taller.id)
      .gte("created_at", inicioMes),
    supabase
      .from("ordenes_trabajo")
      .select("monto_total")
      .eq("taller_id", taller.id)
      .gte("created_at", inicioMesPasado)
      .lte("created_at", finMesPasado),
  ]);

  const mes = otsMes ?? [];
  const pasado = otsPasado ?? [];
  const ingresosMes = mes.reduce((s, o) => s + (o.monto_total || 0), 0);
  const ingresosPasado = pasado.reduce((s, o) => s + (o.monto_total || 0), 0);
  const ticketPromedio = mes.length > 0 ? Math.round(ingresosMes / mes.length) : 0;
  const aprobadas = mes.filter(o => o.aprobado_por_cliente).length;
  const cerradas = mes.filter(o => o.estado === "cerrado").length;
  const crecimiento = ingresosPasado > 0
    ? Math.round(((ingresosMes - ingresosPasado) / ingresosPasado) * 100)
    : null;

  const estadosChart = [
    { label: "Pendiente",    count: mes.filter(o => o.estado === "pendiente").length,          color: "#FFB020" },
    { label: "En proceso",   count: mes.filter(o => o.estado === "en_proceso").length,         color: "#1A6BFF" },
    { label: "Esp. repuesto",count: mes.filter(o => o.estado === "esperando_repuesto").length, color: "#FF8C00" },
    { label: "Listo",        count: mes.filter(o => o.estado === "listo").length,              color: "#00D68F" },
    { label: "Cerrado",      count: cerradas,                                                   color: "rgba(255,255,255,0.2)" },
  ];

  return (
    <div className="pb-28 min-h-screen" style={{ background: "#0B0D14" }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-5">
        <h1 className="text-xl font-extrabold text-white">Reportes</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
          {MESES[now.getMonth()]} {now.getFullYear()}
        </p>
      </div>

      <div className="px-4 space-y-4">

        {/* ── INGRESOS MES ── */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(26,107,255,0.15) 0%, rgba(26,107,255,0.04) 100%)",
            border: "1px solid rgba(26,107,255,0.18)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 w-36 h-36 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(26,107,255,0.12) 0%, transparent 70%)" }}
          />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              Ingresos del mes
            </p>
            <p className="text-3xl font-extrabold text-white tabular-nums leading-none">
              {formatCLP(ingresosMes)}
            </p>
            {crecimiento !== null && (
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: crecimiento >= 0 ? "#00D68F" : "#FF4757" }}
                >
                  {crecimiento >= 0 ? "↑" : "↓"} {Math.abs(crecimiento)}%
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  vs {MESES[now.getMonth() === 0 ? 11 : now.getMonth() - 1]} ({formatCLPShort(ingresosPasado)})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── GRÁFICO BARRAS 6 MESES ── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(145deg, rgba(26,29,46,0.9) 0%, rgba(18,20,31,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            Ingresos — últimos 6 meses
          </p>
          <GraficoBarras data={mesesData} formatValue={formatCLPShort} />
        </div>

        {/* ── MINI STATS ── */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "OTs del mes",      value: mes.length,       color: "#1A6BFF", fmt: "num" },
            { label: "Ticket promedio",  value: ticketPromedio,   color: "#fff",    fmt: "clp" },
            { label: "Aprobadas online", value: aprobadas,        color: "#00D68F", fmt: "num" },
            { label: "Cerradas",         value: cerradas,         color: "rgba(255,255,255,0.4)", fmt: "num" },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-4"
              style={{
                background: "linear-gradient(145deg, rgba(26,29,46,0.85) 0%, rgba(18,20,31,0.9) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>{s.label}</p>
              <p className="font-extrabold leading-none tabular-nums" style={{ color: s.color, fontSize: s.fmt === "clp" ? 18 : 28 }}>
                {s.fmt === "clp" ? formatCLPShort(s.value) : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── DISTRIBUCIÓN ESTADOS ── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(145deg, rgba(26,29,46,0.9) 0%, rgba(18,20,31,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            Distribución por estado
          </p>
          <div className="space-y-3">
            {estadosChart.map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>{row.label}</span>
                  <span className="font-bold" style={{ color: row.color }}>{row.count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: mes.length > 0 ? `${(row.count / mes.length) * 100}%` : "0%",
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
