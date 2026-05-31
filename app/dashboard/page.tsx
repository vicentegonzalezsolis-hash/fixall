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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    <div className="pb-28 bg-bg min-h-screen">
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden px-4 pt-12 pb-8">
        {/* Glow fondo */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(26,107,255,0.12) 0%, transparent 70%)" }}
        />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {saludo} 👋
            </p>
            <h1 className="text-xl font-extrabold text-white leading-tight">{taller.nombre}</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {taller.comuna}
            </p>
          </div>
          <Link
            href="/perfil"
            className="relative w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base text-white"
            style={{
              background: "linear-gradient(135deg, #1A6BFF 0%, #0052e0 100%)",
              boxShadow: "0 4px 16px rgba(26,107,255,0.35)",
            }}
          >
            {taller.nombre[0].toUpperCase()}
          </Link>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="px-4 mb-6">
        {/* Ingresos — card grande */}
        <div
          className="rounded-2xl p-5 mb-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(26,107,255,0.18) 0%, rgba(26,107,255,0.06) 100%)",
            border: "1px solid rgba(26,107,255,0.2)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 w-32 h-32 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(26,107,255,0.15) 0%, transparent 70%)" }}
          />
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
            Ingresos OTs activas
          </p>
          <p className="text-3xl font-extrabold text-white leading-none">{formatCLP(stats.ingresos)}</p>
          <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
            {stats.total} orden{stats.total !== 1 ? "es" : ""} en curso
          </p>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <MiniStat
            label="Activas"
            value={stats.total}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="4" width="14" height="9" rx="2" stroke="#1A6BFF" strokeWidth="1.4"/>
                <path d="M5 4V3a2 2 0 014 0v1" stroke="#1A6BFF" strokeWidth="1.4"/>
              </svg>
            }
            color="#1A6BFF"
            bg="rgba(26,107,255,0.1)"
            border="rgba(26,107,255,0.18)"
          />
          <MiniStat
            label="En proceso"
            value={stats.en_proceso}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#FFB020" strokeWidth="1.4"/>
                <path d="M8 5v3l2 2" stroke="#FFB020" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            }
            color="#FFB020"
            bg="rgba(255,176,32,0.1)"
            border="rgba(255,176,32,0.18)"
          />
          <MiniStat
            label="Listos"
            value={stats.listas}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#00D68F" strokeWidth="1.4"/>
                <path d="M5.5 8l2 2 3-3" stroke="#00D68F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            color="#00D68F"
            bg="rgba(0,214,143,0.1)"
            border="rgba(0,214,143,0.18)"
          />
        </div>
      </div>

      {/* ── ALERTA STOCK ── */}
      {stockBajo && stockBajo.length > 0 && (
        <div className="px-4 mb-5">
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{
              background: "rgba(255,176,32,0.06)",
              border: "1px solid rgba(255,176,32,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span className="text-sm font-semibold" style={{ color: "#FFB020" }}>
                  Stock bajo en inventario
                </span>
              </div>
              <Link
                href="/inventario"
                className="text-xs font-semibold"
                style={{ color: "rgba(255,176,32,0.6)" }}
              >
                Ver todo →
              </Link>
            </div>
            <div className="space-y-1.5">
              {stockBajo.map((item) => {
                const pct = Math.round((item.stock_actual / item.stock_minimo) * 100);
                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{ color: "rgba(255,255,255,0.7)" }}>{item.nombre}</span>
                      <span style={{ color: "#FFB020" }} className="font-semibold">
                        {item.stock_actual}/{item.stock_minimo}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,176,32,0.15)" }}>
                      <div
                        className="h-1 rounded-full"
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
          <h2 className="text-base font-bold text-white">Órdenes activas</h2>
          <Link
            href="/ot/nueva"
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(26,107,255,0.15)", color: "#1A6BFF", border: "1px solid rgba(26,107,255,0.2)" }}
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

/* ── Sub-components ── */

function MiniStat({
  label, value, icon, color, bg, border,
}: {
  label: string; value: number; icon: React.ReactNode;
  color: string; bg: string; border: string;
}) {
  return (
    <div
      className="rounded-2xl p-3.5 flex flex-col gap-2"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${bg}` }}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold leading-none" style={{ color }}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
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
        border: "1px dashed rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(26,107,255,0.08)", border: "1px solid rgba(26,107,255,0.15)" }}
      >
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <rect x="3" y="6" width="20" height="15" rx="3" stroke="#1A6BFF" strokeWidth="1.5"/>
          <path d="M9 6V5a3 3 0 016 0v1" stroke="#1A6BFF" strokeWidth="1.5"/>
          <path d="M9 13h8M9 16.5h5" stroke="#1A6BFF" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-sm font-semibold text-white mb-1">Sin órdenes activas</p>
      <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
        Crea tu primera OT para comenzar
      </p>
      <Link
        href="/ot/nueva"
        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #1A6BFF 0%, #0052e0 100%)", boxShadow: "0 6px 20px rgba(26,107,255,0.3)" }}
      >
        Crear primera OT
      </Link>
    </div>
  );
}
