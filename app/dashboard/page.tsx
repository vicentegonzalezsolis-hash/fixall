import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import OTCard from "@/components/OTCard";
import AppHeader from "@/components/AppHeader";
import { OrdenTrabajo } from "@/types/database";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
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
    en_proceso: activas.filter((o) => o.estado === "en_proceso").length,
    listas: activas.filter((o) => o.estado === "listo").length,
    ingresos: activas.reduce((s, o) => s + (o.monto_total || 0), 0),
  };

  const { data: stockBajo } = await supabase
    .from("inventario")
    .select("id, nombre, stock_actual, stock_minimo")
    .eq("taller_id", taller.id)
    .filter("stock_actual", "lte", "stock_minimo")
    .limit(3);

  return (
    <div className="pb-28 min-h-screen" style={{ background: "#0D0D0D" }}>

      <AppHeader tallerNombre={taller.nombre} />

      {/* ── CARD INGRESOS ── */}
      <div className="px-4 mb-4 mt-3">
        <div
          className="rounded-2xl p-5"
          style={{ background: "#1E466B" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "#67BAF4" }}
          >
            Ingresos OTs activas
          </p>
          <p className="text-3xl font-extrabold leading-none tabular-nums" style={{ color: "#FAFAFA" }}>
            {formatCLP(stats.ingresos)}
          </p>
          <p className="text-xs mt-2" style={{ color: "rgba(103,186,244,0.7)" }}>
            {stats.total} orden{stats.total !== 1 ? "es" : ""} activa{stats.total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── MINI STATS ── */}
      <div className="px-4 grid grid-cols-3 gap-2.5 mb-5">
        <MiniStat label="Activas" value={stats.total} color="#67BAF4" icon={<ClipboardList size={17} color="#67BAF4" strokeWidth={1.8} />} />
        <MiniStat label="Proceso" value={stats.en_proceso} color="#F59E0B" icon={<Clock size={17} color="#F59E0B" strokeWidth={1.8} />} />
        <MiniStat label="Listos" value={stats.listas} color="#10B981" icon={<CheckCircle2 size={17} color="#10B981" strokeWidth={1.8} />} />
      </div>

      {/* ── ALERTA STOCK ── */}
      {stockBajo && stockBajo.length > 0 && (
        <div className="px-4 mb-5">
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{
              background: "#111827",
              border: "1px solid #1a2a3a",
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}
                >
                  <AlertTriangle size={12} /> Stock bajo
                </span>
              </div>
              <Link
                href="/inventario"
                className="text-xs font-semibold"
                style={{ color: "#F59E0B" }}
              >
                Ver todo →
              </Link>
            </div>
            <div className="space-y-2">
              {stockBajo.map((item) => {
                const pct = Math.round((item.stock_actual / Math.max(item.stock_minimo, 1)) * 100);
                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#555555" }}>{item.nombre}</span>
                      <span className="font-semibold tabular-nums" style={{ color: "#F59E0B" }}>
                        {item.stock_actual} / {item.stock_minimo}
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: "rgba(245,158,11,0.12)" }}
                    >
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, background: "#F59E0B" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── OTs ACTIVAS ── */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold" style={{ color: "#FAFAFA" }}>Órdenes activas</h2>
          <Link
            href="/ot/nueva"
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "#1E466B", color: "#67BAF4" }}
          >
            + Nueva OT
          </Link>
        </div>

        {activas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2.5">
            {activas.map((ot) => (
              <OTCard key={ot.id} ot={ot} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function MiniStat({
  label, value, color, icon,
}: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{ background: "#111827", border: "1px solid #1a2a3a" }}
    >
      <div className="mb-2.5">{icon}</div>
      <p className="text-2xl font-extrabold leading-none tabular-nums" style={{ color }}>
        {value}
      </p>
      <p
        className="text-[10px] font-semibold uppercase tracking-wide mt-1"
        style={{ color: "#555555" }}
      >
        {label}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-8 flex flex-col items-center text-center"
      style={{
        background: "#111827",
        border: "1px dashed #1a2a3a",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "#1E466B",
          border: "1px solid #67BAF4",
        }}
      >
        <ClipboardList size={26} color="#67BAF4" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: "#FAFAFA" }}>Sin órdenes activas</p>
      <p className="text-xs mb-5" style={{ color: "#555555" }}>
        Crea tu primera OT para comenzar
      </p>
      <Link
        href="/ot/nueva"
        className="px-6 py-2.5 rounded-xl text-sm font-bold"
        style={{ background: "#1E466B", color: "#67BAF4" }}
      >
        Crear primera OT
      </Link>
    </div>
  );
}
