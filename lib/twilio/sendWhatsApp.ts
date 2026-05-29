import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  try {
    const toFormatted = to.startsWith("whatsapp:")
      ? to
      : `whatsapp:${to.startsWith("+") ? to : `+56${to.replace(/^0/, "")}`}`;

    await client.messages.create({
      from: process.env.TWILIO_WA_NUMBER!,
      to: toFormatted,
      body,
    });
    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

export function buildPresupuestoMessage(
  tallerNombre: string,
  patente: string,
  numeroOT: number,
  token: string
): string {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/p/${token}`;
  return (
    `🔧 *${tallerNombre}* — OT #${numeroOT}\n\n` +
    `Hola! Hemos recibido tu vehículo *${patente}* y ya tenemos el diagnóstico listo.\n\n` +
    `Revisa el presupuesto detallado con fotos y apruébalo desde aquí:\n${url}\n\n` +
    `Cualquier consulta responde este mensaje.`
  );
}

export function buildListoMessage(
  tallerNombre: string,
  patente: string,
  numeroOT: number,
  direccion: string
): string {
  return (
    `✅ *${tallerNombre}* — OT #${numeroOT}\n\n` +
    `¡Tu vehículo *${patente}* está listo para retirar! 🎉\n\n` +
    `📍 ${direccion}\n\n` +
    `Cualquier consulta responde este mensaje.`
  );
}
