import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import EstadoBadge from "@/components/EstadoBadge";
import { OrdenTrabajo } from "@/types/database";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export default async function PatenteDetailPage({
  params,
}: {
  params: Promise<{ patente: string }>;
}) {
  const { patente } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: taller } = await supabase.from("talleres").select("id").eq("user_id", user.id).single();
  if (!taller) redirect("/perfil");

  const { data: v } = await supabase
    .from("vehiculos")
    .select("*")
    .eq("taller_id", taller.id)
    .ilike("patente", patente)
    .single();

  if (!v) redirect("/patentes");

  const { data: ots } = await supabase
    .from("ordenes_trabajo")
    .select("*")
    .eq("vehiculo_id", v.id)
    .order("created_at", { ascending: false });

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link href="/patentes" className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center border border-border">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="text-xl font-bold font-mono">{v.patente}</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="card grid grid-cols-2 gap-y-3">
          <InfoRow label="Marca/Modelo" value={`${v.marca} ${v.modelo}`} />
          <InfoRow label="Año" value={v.anio?.toString() ?? "—"} />
          <InfoRow label="Color" value={v.color || "—"} />
          <InfoRow label="Kms" value={v.kms_actuales ? `${v.kms_actuales.toLocaleString()} km` : "—"} />
          <InfoRow label="Aceite rec." value={v.aceite_recomendado || "—"} />
          <InfoRow label="N° motor" value={v.numero_motor || "—"} />
        </div>

        <div className="card">
          <p className="text-xs text-text-muted mb-0.5">Cliente</p>
          <p className="font-semibold text-white">{v.cliente_nombre || "—"}</p>
          {v.cliente_whatsapp && (
            <a href={`https://wa.me/${v.cliente_whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-success mt-0.5 block">{v.cliente_whatsapp}</a>
          )}
          {v.notas_internas && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-text-muted mb-0.5">Notas</p>
              <p className="text-sm text-white">{v.notas_internas}</p>
            </div>
          )}
        </div>

        <Link href={`/ot/nueva?patente=${v.patente}`} className="btn-primary w-full text-center block py-3">
          + Nueva OT para este vehículo
        </Link>

        <div>
          <h2 className="text-base font-bold mb-3">Historial de OTs ({ots?.length ?? 0})</h2>
          {(!ots || ots.length === 0) ? (
            <p className="text-sm text-text-muted">Sin órdenes previas</p>
          ) : (
            <div className="space-y-3">
              {(ots as OrdenTrabajo[]).map(ot => (
                <Link key={ot.id} href={`/ot/${ot.id}`} className="block card hover:border-border/50 active:scale-[0.98] transition-all">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs text-text-muted font-mono">OT #{ot.numero_ot}</span>
                    <EstadoBadge estado={ot.estado} />
                  </div>
                  <p className="text-sm text-white mb-2 line-clamp-1">{ot.descripcion_problema}</p>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">{new Date(ot.created_at).toLocaleDateString("es-CL")}</span>
                    <span className="text-sm font-bold text-white">{formatCLP(ot.monto_total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  );
}
