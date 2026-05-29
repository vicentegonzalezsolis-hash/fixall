"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { OrdenTrabajo, Taller, ItemOT, FotoOT } from "@/types/database";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

type Props = {
  ot: OrdenTrabajo & { vehiculo: NonNullable<OrdenTrabajo["vehiculo"]>; items: ItemOT[]; fotos: FotoOT[] };
  taller: Pick<Taller, "nombre" | "direccion" | "comuna" | "telefono" | "whatsapp">;
};

export default function PresupuestoClient({ ot: initialOt, taller }: Props) {
  const supabase = createClient();
  const [ot, setOt] = useState(initialOt);
  const [confirming, setConfirming] = useState<"aprobar" | "rechazar" | null>(null);
  const [done, setDone] = useState<"aprobado" | "rechazado" | null>(
    initialOt.aprobado_por_cliente ? "aprobado" : null
  );
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fotosD = ot.fotos.filter(f => f.tipo === "diagnostico");
  const trabajos = ot.items.filter(i => i.tipo === "trabajo");
  const repuestos = ot.items.filter(i => i.tipo === "repuesto");

  // Realtime: escuchar aprobación
  useEffect(() => {
    const channel = supabase
      .channel(`ot-${ot.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "ordenes_trabajo",
        filter: `id=eq.${ot.id}`,
      }, (payload) => {
        setOt(prev => ({ ...prev, ...payload.new }));
        if (payload.new.aprobado_por_cliente) setDone("aprobado");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ot.id]);

  async function handleAprobacion(aprobado: boolean) {
    setConfirming(null);
    await supabase
      .from("ordenes_trabajo")
      .update({
        aprobado_por_cliente: aprobado,
        aprobado_at: aprobado ? new Date().toISOString() : null,
      })
      .eq("id", ot.id);
    setDone(aprobado ? "aprobado" : "rechazado");
    setOt(prev => ({ ...prev, aprobado_por_cliente: aprobado }));
  }

  const waLink = `https://wa.me/${taller.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Hola ${taller.nombre}, consulta sobre OT #${ot.numero_ot} - ${ot.vehiculo.patente}`
  )}`;

  return (
    <div className="min-h-screen bg-bg pb-10">
      {/* Header taller */}
      <div className="bg-surface border-b border-border px-4 py-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary-dim flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10C4 6.686 6.686 4 10 4s6 2.686 6 6-2.686 6-6 6S4 13.314 4 10z" stroke="#1A6BFF" strokeWidth="1.5"/>
              <path d="M8 10l1.5 1.5 3-3" stroke="#1A6BFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-white">{taller.nombre}</h1>
            <p className="text-xs text-text-muted">{taller.direccion}, {taller.comuna}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* OT Header */}
        <div>
          <p className="text-xs text-text-muted font-mono mb-1">Presupuesto OT #{ot.numero_ot}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-white">{ot.vehiculo.patente}</span>
            <span className="text-base text-text-secondary">{ot.vehiculo.marca} {ot.vehiculo.modelo} {ot.vehiculo.anio}</span>
          </div>
          <p className="text-sm text-text-secondary mt-1">Cliente: {ot.vehiculo.cliente_nombre}</p>
        </div>

        {/* Descripción */}
        <div className="card">
          <p className="text-xs text-text-muted mb-1">Problema reportado</p>
          <p className="text-sm text-white">{ot.descripcion_problema}</p>
        </div>

        {/* Fotos diagnóstico */}
        {fotosD.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Fotos del diagnóstico</p>
            <div className="grid grid-cols-2 gap-2">
              {fotosD.map(f => (
                <div
                  key={f.id}
                  className="relative rounded-xl overflow-hidden aspect-square bg-surface-2 cursor-pointer"
                  onClick={() => setLightbox(f.url)}
                >
                  <Image src={f.url} alt={f.descripcion || "foto"} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trabajos */}
        {trabajos.length > 0 && (
          <div className="card">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">Mano de obra</p>
            <div className="space-y-2">
              {trabajos.map(item => (
                <LineItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Repuestos */}
        {repuestos.length > 0 && (
          <div className="card">
            <p className="text-xs font-semibold text-warning uppercase tracking-wide mb-3">Repuestos</p>
            <div className="space-y-2">
              {repuestos.map(item => (
                <LineItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Totales */}
        <div className="card">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Neto</span><span>{formatCLP(ot.monto_neto)}</span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>IVA (19%)</span><span>{formatCLP(ot.monto_iva)}</span>
            </div>
            <div className="flex justify-between text-xl font-extrabold text-white pt-2 border-t border-border">
              <span>Total</span><span>{formatCLP(ot.monto_total)}</span>
            </div>
          </div>
        </div>

        {/* Garantía */}
        <div className="bg-success-dim border border-success/20 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5z" stroke="#00D68F" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
            <span className="text-success text-sm font-semibold">Garantía incluida</span>
          </div>
          <p className="text-xs text-success/70 mt-1">Todos los trabajos tienen garantía según condiciones del taller.</p>
        </div>

        {/* Estado aprobación */}
        {done === "aprobado" ? (
          <div className="card text-center py-6">
            <div className="w-14 h-14 rounded-full bg-success-dim flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M8 14l4 4 8-8" stroke="#00D68F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="font-bold text-lg text-white mb-1">¡Presupuesto aprobado!</h2>
            <p className="text-text-secondary text-sm">El taller ya recibió tu aprobación y comenzará el trabajo.</p>
          </div>
        ) : done === "rechazado" ? (
          <div className="card text-center py-6">
            <p className="text-text-secondary text-sm">Has rechazado el presupuesto. El taller te contactará a la brevedad.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm text-text-secondary">¿Apruebas este presupuesto?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming("rechazar")}
                className="flex-1 py-3.5 rounded-xl border border-danger/30 text-danger font-semibold text-sm active:scale-95 transition-transform"
              >
                Rechazar
              </button>
              <button
                onClick={() => setConfirming("aprobar")}
                className="flex-1 py-3.5 rounded-xl bg-success text-white font-bold text-sm active:scale-95 transition-transform"
              >
                ✓ Aprobar
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-semibold text-sm active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1C4.582 1 1 4.582 1 9c0 1.406.364 2.727 1 3.875L1 17l4.25-1.125A7.96 7.96 0 009 17c4.418 0 8-3.582 8-8S13.418 1 9 1z" stroke="#25D366" strokeWidth="1.3" fill="none"/>
            <path d="M6.5 8c0-.276.224-.5.5-.5h.5a.5.5 0 01.5.5v1l1 1-1 .5c0 1 1 2 2 2l.5-1 1 1v.5a.5.5 0 01-.5.5H10c-2 0-3.5-1.5-3.5-3.5V8z" fill="#25D366"/>
          </svg>
          Consultar por WhatsApp
        </a>

        <p className="text-center text-xs text-text-muted">
          Powered by <span className="text-primary font-semibold">Fixall</span>
        </p>
      </div>

      {/* Modal confirmación */}
      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center">
          <div className="bg-surface border-t border-border w-full max-w-mobile rounded-t-3xl p-6">
            <h3 className="text-lg font-bold mb-2">
              {confirming === "aprobar" ? "Aprobar presupuesto" : "Rechazar presupuesto"}
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              {confirming === "aprobar"
                ? `Confirmas la aprobación del presupuesto por ${formatCLP(ot.monto_total)}. El taller comenzará el trabajo.`
                : "¿Seguro que quieres rechazar este presupuesto? El taller será notificado."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => handleAprobacion(confirming === "aprobar")}
                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white active:scale-95 transition-transform ${
                  confirming === "aprobar" ? "bg-success" : "bg-danger"
                }`}
              >
                {confirming === "aprobar" ? "Sí, aprobar" : "Sí, rechazar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative w-full max-w-mobile aspect-square">
            <Image src={lightbox} alt="" fill className="object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

function LineItem({ item }: { item: ItemOT }) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{item.descripcion}</p>
        <p className="text-xs text-text-muted">{item.cantidad} × {formatCLP(item.precio_unitario)}</p>
      </div>
      <p className="text-sm font-semibold text-white shrink-0">{formatCLP(item.subtotal)}</p>
    </div>
  );
}
