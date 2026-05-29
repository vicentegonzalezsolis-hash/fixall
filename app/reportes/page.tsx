import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export default async function ReportesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: taller } = await supabase.from("talleres").select("id, nombre").eq("user_id", user.id).single();
  if (!taller) redirect("/perfil");

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const mesPasado = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const inicioMesPasado = mesPasado;
  const finMesPasado = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const [{ data: otsMes }, { data: otsPasado }] = await Promise.all([
    supabase.from("ordenes_trabajo").select("monto_total, estado, aprobado_por_cliente").eq("taller_id", taller.id).gte("created_at", inicioMes),
    supabase.from("ordenes_trabajo").select("monto_total, estado").eq("taller_id", taller.id).gte("created_at", inicioMesPasado).lte("created_at", finMesPasado),
  ]);

  const mes = otsMes ?? [];
  const pasado = otsPasado ?? [];

  const ingresosMes = mes.reduce((s, o) => s + (o.monto_total || 0), 0);
  const ingresosPasado = pasado.reduce((s, o) => s + (o.monto_total || 0), 0);
  const ticketPromedio = mes.length > 0 ? Math.round(ingresosMes / mes.length) : 0;
  const aprobadas = mes.filter(o => o.aprobado_por_cliente).length;
  const cerradas = mes.filter(o => o.estado === "cerrado").length;

  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const mesNombre = meses[now.getMonth()];
  const crecimiento = ingresosPasado > 0
    ? Math.round(((ingresosMes - ingresosPasado) / ingresosPasado) * 100)
    : null;

  return (
    <div className="pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">Reportes</h1>
        <p className="text-text-secondary text-sm">{mesNombre} {now.getFullYear()}</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Ingresos */}
        <div className="card">
          <p className="text-xs text-text-muted mb-1">Ingresos del mes</p>
          <p className="text-3xl font-extrabold text-white">{formatCLP(ingresosMes)}</p>
          {crecimiento !== null && (
            <p className={`text-sm mt-1 font-semibold ${crecimiento >= 0 ? "text-success" : "text-danger"}`}>
              {crecimiento >= 0 ? "+" : ""}{crecimiento}% vs mes anterior ({formatCLP(ingresosPasado)})
            </p>
          )}
        </div>

        {/* Grid stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs text-text-muted mb-1">OTs del mes</p>
            <p className="text-2xl font-bold text-primary">{mes.length}</p>
          </div>
          <div className="card">
            <p className="text-xs text-text-muted mb-1">Ticket promedio</p>
            <p className="text-xl font-bold text-white">{formatCLP(ticketPromedio)}</p>
          </div>
          <div className="card">
            <p className="text-xs text-text-muted mb-1">Aprobadas online</p>
            <p className="text-2xl font-bold text-success">{aprobadas}</p>
          </div>
          <div className="card">
            <p className="text-xs text-text-muted mb-1">OTs cerradas</p>
            <p className="text-2xl font-bold text-text-secondary">{cerradas}</p>
          </div>
        </div>

        {/* Estados */}
        <div className="card">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Distribución por estado</p>
          {[
            { label: "Pendiente",          count: mes.filter(o => o.estado === "pendiente").length,          color: "bg-warning" },
            { label: "En proceso",         count: mes.filter(o => o.estado === "en_proceso").length,         color: "bg-primary" },
            { label: "Esp. repuesto",      count: mes.filter(o => o.estado === "esperando_repuesto").length, color: "bg-warning" },
            { label: "Listo",              count: mes.filter(o => o.estado === "listo").length,              color: "bg-success" },
            { label: "Cerrado",            count: cerradas,                                                   color: "bg-surface-2" },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3 mb-2">
              <span className="text-sm text-text-secondary w-28">{row.label}</span>
              <div className="flex-1 bg-surface-2 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${row.color}`}
                  style={{ width: mes.length > 0 ? `${(row.count / mes.length) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-sm font-semibold text-white w-4 text-right">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
