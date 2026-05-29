import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PresupuestoClient from "./PresupuestoClient";

export default async function PresupuestoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: ot } = await supabase
    .from("ordenes_trabajo")
    .select("*, vehiculo:vehiculos(*), items:items_ot(*), fotos:fotos_ot(*)")
    .eq("link_token", token)
    .single();

  if (!ot) notFound();

  const { data: taller } = await supabase
    .from("talleres")
    .select("nombre, direccion, comuna, telefono, whatsapp")
    .eq("id", ot.taller_id)
    .single();

  if (!taller) notFound();

  return <PresupuestoClient ot={ot} taller={taller} />;
}
