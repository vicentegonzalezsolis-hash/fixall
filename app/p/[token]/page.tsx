import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import PresupuestoClient from "./PresupuestoClient";

// Ruta pública — no requiere sesión.
// Usa service role para bypasear RLS (corre solo en servidor).
export default async function PresupuestoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Validar formato UUID antes de consultar
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(token)) notFound();

  const supabase = createServiceClient();

  const { data: ot, error: otError } = await supabase
    .from("ordenes_trabajo")
    .select("*, vehiculo:vehiculos(*), items:items_ot(*), fotos:fotos_ot(*)")
    .eq("link_token", token)
    .single();

  if (otError || !ot) notFound();

  const { data: taller, error: tallerError } = await supabase
    .from("talleres")
    .select("nombre, direccion, comuna, telefono, whatsapp")
    .eq("id", ot.taller_id)
    .single();

  if (tallerError || !taller) notFound();

  return <PresupuestoClient ot={ot} taller={taller} />;
}
