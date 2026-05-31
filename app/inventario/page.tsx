import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import InventarioClient from "./InventarioClient";

export default async function InventarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: taller } = await supabase.from("talleres").select("id").eq("user_id", user.id).single();
  if (!taller) redirect("/perfil");

  const { data: items } = await supabase
    .from("inventario")
    .select("*")
    .eq("taller_id", taller.id)
    .order("nombre");

  const total = items?.length ?? 0;
  const bajos = items?.filter(i => i.stock_actual <= i.stock_minimo).length ?? 0;

  return (
    <div className="pb-28 bg-bg min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-5">
        <h1 className="text-xl font-extrabold text-white">Inventario</h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {total} ítem{total !== 1 ? "s" : ""}
          </span>
          {bajos > 0 && (
            <>
              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span className="text-xs font-semibold" style={{ color: "#FFB020" }}>
                {bajos} con stock bajo
              </span>
            </>
          )}
        </div>
      </div>
      <InventarioClient items={items ?? []} tallerId={taller.id} />
      <BottomNav />
    </div>
  );
}
