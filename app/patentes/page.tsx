import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import PatentesClient from "./PatentesClient";

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
    <div className="pb-28 min-h-screen" style={{ background: "#0B0D14" }}>
      <div className="px-4 pt-12 pb-4">
        <Logo size="sm" className="mb-3" />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-extrabold text-white">Vehículos</h1>
          <Link href="/patentes/nueva" className="btn-primary text-sm px-4 py-2">+ Nuevo</Link>
        </div>
      </div>

      <PatentesClient vehiculos={vehiculos ?? []} />
      <BottomNav />
    </div>
  );
}
