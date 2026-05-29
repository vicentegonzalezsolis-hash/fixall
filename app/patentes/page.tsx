import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default async function PatentesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: taller } = await supabase.from("talleres").select("id").eq("user_id", user.id).single();
  if (!taller) redirect("/perfil");

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("*")
    .eq("taller_id", taller.id)
    .order("created_at", { ascending: false });

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">Vehículos</h1>
        <Link href="/patentes/nueva" className="btn-primary text-sm px-4 py-2">+ Nuevo</Link>
      </div>

      <div className="px-4 space-y-3">
        {(!vehiculos || vehiculos.length === 0) ? (
          <div className="card text-center py-10">
            <p className="text-text-muted text-sm mb-4">Sin vehículos registrados</p>
            <Link href="/patentes/nueva" className="btn-primary inline-block">Registrar vehículo</Link>
          </div>
        ) : (
          vehiculos.map(v => (
            <Link key={v.id} href={`/patentes/${v.patente}`} className="block card hover:border-border/50 active:scale-[0.98] transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="text-lg font-bold font-mono text-white">{v.patente}</span>
                <span className="text-xs text-text-muted">{v.anio}</span>
              </div>
              <p className="text-sm text-text-secondary mb-1">{v.marca} {v.modelo} · {v.color}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">{v.cliente_nombre}</p>
                <p className="text-xs text-text-muted">{v.kms_actuales?.toLocaleString()} km</p>
              </div>
            </Link>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}
