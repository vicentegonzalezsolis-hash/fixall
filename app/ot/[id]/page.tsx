import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OTDetailClient from "./OTDetailClient";

export default async function OTDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: taller } = await supabase
    .from("talleres")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!taller) redirect("/perfil");

  const { data: ot } = await supabase
    .from("ordenes_trabajo")
    .select("*, vehiculo:vehiculos(*), items:items_ot(*), fotos:fotos_ot(*)")
    .eq("id", id)
    .eq("taller_id", taller.id)
    .single();

  if (!ot) redirect("/dashboard");

  return <OTDetailClient ot={ot} taller={taller} />;
}
