import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import OTCard from "@/components/OTCard";
import { OrdenTrabajo } from "@/types/database";

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

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="pb-28 min-h-screen" style={{ background: "#0B0D14" }}>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden px-4 pt-12 pb-6">
        {/* Glow de fondo sutil */}
        <div
          className="pointer-events-none absolute -top-8 -right-8 w-52 h-52 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(26,107,255,0.1) 0%, transparent 65%)" }}
        />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              {saludo} 👋
            </p>
            <h1 className="text-xl font-extrabold text-white leading-tight">{taller.nombre}</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
              {taller.comuna}
            </p>
          </div>

          {/* Avatar — sin glow */}
          <Link
            href="/perfil"
            className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base text-white"
            style={{
              background: "rgba(26,107,255,0.18)",
              border: "1px solid rgba(26,107,255,0.25)",
              color: "#1A6BFF",
            }}
          >
            {taller.nombre[0].toUpperCase()}
          </Link>
        </div>
      </div>

      {/* ── CARD INGRESOS ── */}
      <div className="px-4 mb-4">
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(26,107,255,0.15) 0%, rgba(26,107,255,0.05) 100%)",
            border: "1px solid rgba(26,107,255,0.18)",
          }}
        >
          {/* Círculo decorativo fondo */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(26,107,255,0.12) 0%, transparent 70%)" }}
          />
          <div className="relative z-10">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Ingresos OTs activas
            </p>
            <p className="text-3xl font-extrabold text-white leading-none tabular-nums">
              {formatCLP(stats.ingresos)}
            </p>
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.32)" }}>
              {stats.total} orden{stats.total !== 1 ? "es" : ""} activa{stats.total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── MINI STATS ── */}
      <div className="px-4 grid grid-cols-3 gap-2.5 mb-5">
        <MiniStat
          label="Activas"
          value={stats.total}
          color="#1A6BFF"
          bg="rgba(26,107,255,0.08)"
          border="rgba(26,107,255,0.15)"
          icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="3.5" width="13" height="9" rx="2" stroke="#1A6BFF" strokeWidth="1.3" />
              <path d="M4.5 3.5V2.5a2 2 0 015 0v1" stroke="#1A6BFF" strokeWidth="1.3" />
              <path d="M4 8h7" stroke="#1A6BFF" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          }
        />
        <MiniStat
          label="Proceso"
          value={stats.en_proceso}
          color="#FFB020"
          bg="rgba(255,176,32,0.08)"
          border="rgba(255,176,32,0.15)"
          icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="#FFB020" strokeWidth="1.3" />
              <path d="M7.5 4.5v3l2 1.5" stroke="#FFB020" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          }
        />
        <MiniStat
          label="Listos"
          value={stats.listas}
          color="#00D68F"
          bg="rgba(0,214,143,0.08)"
          border="rgba(0,214,143,0.15)"
          icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="#00D68F" strokeWidth="1.3" />
              <path
                d="M5 7.5l2 2 3.5-3"
                stroke="#00D68F"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      </div>

      {/* ── ALERTA STOCK ── */}
      {stockBajo && stockBajo.length > 0 && (
        <div className="px-4 mb-5">
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{
              background: "rgba(255,176,32,0.05)",
              border: "1px solid rgba(255,176,32,0.18)",
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md"
                  style={{ background: "rgba(255,176,32,0.15)", color: "#FFB020" }}
                >
                  ⚠ Stock bajo
                </span>
              </div>
              <Link
                href="/inventario"
                className="text-xs font-semibold"
                style={{ color: "rgba(255,176,32,0.55)" }}
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
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{item.nombre}</span>
                      <span className="font-semibold tabular-nums" style={{ color: "#FFB020" }}>
                        {item.stock_actual} / {item.stock_minimo}
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,176,32,0.12)" }}
                    >
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, background: "#FFB020" }}
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
          <h2 className="text-[15px] font-bold text-white">Órdenes activas</h2>
          <Link
            href="/ot/nueva"
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(26,107,255,0.12)",
              color: "#1A6BFF",
              border: "1px solid rgba(26,107,255,0.18)",
            }}
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
  label, value, color, bg, border, icon,
}: {
  label: string; value: number; color: string; bg: string; border: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      {/* Ícono sin caja extra — directo, sin brillo */}
      <div className="mb-2.5">{icon}</div>
      <p className="text-2xl font-extrabold leading-none tabular-nums" style={{ color }}>
        {value}
      </p>
      <p
        className="text-[10px] font-semibold uppercase tracking-wide mt-1"
        style={{ color: "rgba(255,255,255,0.35)" }}
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
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "rgba(26,107,255,0.07)",
          border: "1px solid rgba(26,107,255,0.12)",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <rect x="3" y="6" width="20" height="15" rx="3" stroke="#1A6BFF" strokeWidth="1.4" />
          <path d="M9 6V5a3 3 0 016 0v1" stroke="#1A6BFF" strokeWidth="1.4" />
          <path d="M9 13h8M9 16.5h5" stroke="#1A6BFF" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-white mb-1">Sin órdenes activas</p>
      <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
        Crea tu primera OT para comenzar
      </p>
      <Link
        href="/ot/nueva"
        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{
          background: "linear-gradient(135deg, #1A6BFF 0%, #0052e0 100%)",
          boxShadow: "0 6px 20px rgba(26,107,255,0.25)",
        }}
      >
        Crear primera OT
      </Link>
    </div>
  );
}
