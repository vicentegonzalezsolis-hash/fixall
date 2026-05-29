import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import OTCard from "@/components/OTCard";
import EstadoBadge from "@/components/EstadoBadge";
import { OrdenTrabajo, EstadoOT } from "@/types/database";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: taller } = await supabase
    .from("talleres")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!taller) redirect("/perfil?setup=true");

  const { data: ots } = await supabase
    .from("ordenes_trabajo")
    .select("*, vehiculo:vehiculos(*)")
    .eq("taller_id", taller.id)
    .not("estado", "eq", "cerrado")
    .order("created_at", { ascending: false })
    .limit(20);

  const activas = (ots as OrdenTrabajo[]) ?? [];

  const stats = {
    total: activas.length,
    pendientes: activas.filter(o => o.estado === "pendiente").length,
    en_proceso: activas.filter(o => o.estado === "en_proceso").length,
    listas: activas.filter(o => o.estado === "listo").length,
    ingresos: activas.reduce((s, o) => s + (o.monto_total || 0), 0),
  };

  // Inventario con stock bajo
  const { data: stockBajo } = await supabase
    .from("inventario")
    .select("id, nombre, stock_actual, stock_minimo")
    .eq("taller_id", taller.id)
    .filter("stock_actual", "lte", "stock_minimo")
    .limit(3);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-text-secondary text-sm">Bienvenido 👋</p>
            <h1 className="text-xl font-bold text-white">{taller.nombre}</h1>
          </div>
          <Link href="/perfil" className="w-10 h-10 rounded-full bg-primary-dim border border-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{taller.nombre[0]}</span>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        <StatCard label="OTs activas" value={stats.total} color="primary" />
        <StatCard label="Listas p/ retiro" value={stats.listas} color="success" />
        <StatCard label="En proceso" value={stats.en_proceso} color="warning" />
        <StatCard label="Ingresos OTs" value={formatCLP(stats.ingresos)} color="default" small />
      </div>

      {/* Stock bajo */}
      {stockBajo && stockBajo.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-warning-dim border border-warning/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v5M8 10v1" stroke="#FFB020" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="8" cy="8" r="6" stroke="#FFB020" strokeWidth="1.5"/>
              </svg>
              <span className="text-warning text-sm font-semibold">Stock bajo en inventario</span>
            </div>
            {stockBajo.map(item => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span className="text-white">{item.nombre}</span>
                <span className="text-warning font-semibold">{item.stock_actual}/{item.stock_minimo}</span>
              </div>
            ))}
            <Link href="/inventario" className="text-xs text-warning/70 mt-2 block">Ver inventario →</Link>
          </div>
        </div>
      )}

      {/* OTs activas */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">OTs Activas</h2>
          <Link href="/ot/nueva" className="text-primary text-sm font-semibold">+ Nueva OT</Link>
        </div>

        {activas.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-text-muted text-sm mb-4">No hay OTs activas</p>
            <Link href="/ot/nueva" className="btn-primary inline-block">Crear primera OT</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activas.map(ot => (
              <OTCard key={ot.id} ot={ot} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function StatCard({ label, value, color, small }: {
  label: string;
  value: string | number;
  color: "primary" | "success" | "warning" | "default";
  small?: boolean;
}) {
  const colors = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    default: "text-white",
  };
  return (
    <div className="card">
      <p className="text-text-muted text-xs mb-1">{label}</p>
      <p className={`font-bold ${small ? "text-base" : "text-2xl"} ${colors[color]}`}>{value}</p>
    </div>
  );
}
