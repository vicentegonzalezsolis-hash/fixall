import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { ot_id } = await request.json();
  const supabase = await createClient();
  const { data: ot } = await supabase
    .from("ordenes_trabajo")
    .select("*, vehiculo:vehiculos(*), taller:talleres(*)")
    .eq("id", ot_id)
    .single();
  if (!ot) return NextResponse.json({ error: "OT no encontrada" }, { status: 404 });
  const vehiculo = ot.vehiculo as any;
  const taller = ot.taller as any;
  const wa = vehiculo?.cliente_whatsapp;
  if (!wa) return NextResponse.json({ ok: false, reason: "no whatsapp" });
  const msg = `✅ Tu vehículo ${vehiculo?.patente ?? ""} está listo para retirar en ${taller?.nombre ?? "el taller"}, ${taller?.direccion ?? ""}, ${taller?.comuna ?? ""}.`;
  return NextResponse.json({ ok: true, msg });
}
