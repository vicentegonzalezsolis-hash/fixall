import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsApp, buildPresupuestoMessage } from "@/lib/twilio/sendWhatsApp";

export async function POST(req: Request) {
  const { otId } = await req.json();
  if (!otId) return NextResponse.json({ error: "otId required" }, { status: 400 });

  const supabase = await createServiceClient();

  const { data: ot } = await supabase
    .from("ordenes_trabajo")
    .select("numero_ot, link_token, vehiculo:vehiculos(patente, cliente_whatsapp), taller:talleres(nombre)")
    .eq("id", otId)
    .single();

  if (!ot) return NextResponse.json({ error: "OT not found" }, { status: 404 });

  const wa = (ot.vehiculo as unknown as { cliente_whatsapp: string })?.cliente_whatsapp;
  if (!wa) return NextResponse.json({ ok: false, reason: "no whatsapp" });

  const msg = buildPresupuestoMessage(
    (ot.taller as unknown as { nombre: string })?.nombre ?? "Fixall",
    (ot.vehiculo as unknown as { patente: string })?.patente ?? "",
    ot.numero_ot,
    ot.link_token
  );

  const ok = await sendWhatsApp(wa, msg);
  return NextResponse.json({ ok });
}
