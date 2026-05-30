import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsApp, buildListoMessage } from "@/lib/twilio/sendWhatsApp";

export async function POST(req: Request) {
  const { otId } = await req.json();
  if (!otId) return NextResponse.json({ error: "otId required" }, { status: 400 });

  const supabase = await createServiceClient();

  const { data: ot } = await supabase
    .from("ordenes_trabajo")
    .select("numero_ot, vehiculo:vehiculos(patente, cliente_whatsapp), taller:talleres(nombre, direccion, comuna)")
    .eq("id", otId)
    .single();

  if (!ot) return NextResponse.json({ error: "OT not found" }, { status: 404 });

  const wa = (ot.vehiculo as any as { cliente_whatsapp: string })?.cliente_whatsapp;
  if (!wa) return NextResponse.json({ ok: false, reason: "no whatsapp" });

  const taller = ot.taller as unknown as { nombre: string; direccion: string; comuna: string };
  const msg = buildListoMessage(
    taller?.nombre ?? "Fixall",
    (ot.vehiculo as { patente: string })?.patente ?? "",
    ot.numero_ot,
    `${taller?.direccion}, ${taller?.comuna}`
  );

  const ok = await sendWhatsApp(wa, msg);
  return NextResponse.json({ ok });
}
