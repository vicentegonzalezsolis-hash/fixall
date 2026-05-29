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

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">Inventario</h1>
      </div>
      <InventarioClient items={items ?? []} tallerId={taller.id} />
      <BottomNav />
    </div>
  );
}
