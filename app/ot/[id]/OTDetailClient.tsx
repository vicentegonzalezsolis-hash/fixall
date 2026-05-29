"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EstadoBadge from "@/components/EstadoBadge";
import FotoGrid from "@/components/FotoGrid";
import FotoUploader from "@/components/FotoUploader";
import { OrdenTrabajo, Taller, ItemOT, FotoOT, EstadoOT, TipoItem } from "@/types/database";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

const ESTADOS: EstadoOT[] = ["pendiente", "en_proceso", "esperando_repuesto", "listo", "cerrado"];
const ESTADO_LABEL: Record<EstadoOT, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  esperando_repuesto: "Esp. repuesto",
  listo: "Listo",
  cerrado: "Cerrado",
};

export default function OTDetailClient({ ot: initialOt, taller }: { ot: OrdenTrabajo; taller: Taller }) {
  const router = useRouter();
  const supabase = createClient();
  const [ot, setOt] = useState(initialOt);
  const [items, setItems] = useState<ItemOT[]>((initialOt.items as ItemOT[]) ?? []);
  const [fotos, setFotos] = useState<FotoOT[]>((initialOt.fotos as FotoOT[]) ?? []);
  const [loading, setLoading] = useState(false);

  // Nuevo item
  const [addingItem, setAddingItem] = useState(false);
  const [newTipo, setNewTipo] = useState<TipoItem>("trabajo");
  const [newDesc, setNewDesc] = useState("");
  const [newCant, setNewCant] = useState("1");
  const [newPrecio, setNewPrecio] = useState("");

  const fotosD = fotos.filter(f => f.tipo === "diagnostico");
  const fotosS = fotos.filter(f => f.tipo === "salida");
  const presupuestoUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/p/${ot.link_token}`;

  async function refreshFotos() {
    const { data } = await supabase.from("fotos_ot").select("*").eq("ot_id", ot.id);
    setFotos(data ?? []);
  }

  async function cambiarEstado(estado: EstadoOT) {
    setLoading(true);
    await supabase.from("ordenes_trabajo").update({ estado }).eq("id", ot.id);
    setOt(prev => ({ ...prev, estado }));

    if (estado === "listo" && ot.vehiculo?.cliente_whatsapp) {
      await fetch("/api/whatsapp/listo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otId: ot.id }),
      });
    }
    setLoading(false);
  }

  async function addItem() {
    if (!newDesc || !newPrecio) return;
    const { data } = await supabase
      .from("items_ot")
      .insert({
        ot_id: ot.id,
        tipo: newTipo,
        descripcion: newDesc,
        cantidad: parseFloat(newCant),
        precio_unitario: parseInt(newPrecio),
      })
      .select()
      .single();
    if (data) {
      setItems(prev => [...prev, data]);
      // Refetch ot totals
      const { data: updOt } = await supabase
        .from("ordenes_trabajo")
        .select("monto_total, monto_neto, monto_iva")
        .eq("id", ot.id)
        .single();
      if (updOt) setOt(prev => ({ ...prev, ...updOt }));

      // Descontar inventario si es repuesto
      if (newTipo === "repuesto") {
        const { data: inv } = await supabase
          .from("inventario")
          .select("id, stock_actual")
          .eq("taller_id", taller.id)
          .ilike("nombre", `%${newDesc}%`)
          .single();
        if (inv) {
          await supabase
            .from("inventario")
            .update({ stock_actual: Math.max(0, inv.stock_actual - parseFloat(newCant)) })
            .eq("id", inv.id);
        }
      }
    }
    setNewDesc(""); setNewCant("1"); setNewPrecio(""); setAddingItem(false);
  }

  async function deleteItem(id: string) {
    await supabase.from("items_ot").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    const { data: updOt } = await supabase
      .from("ordenes_trabajo")
      .select("monto_total, monto_neto, monto_iva")
      .eq("id", ot.id)
      .single();
    if (updOt) setOt(prev => ({ ...prev, ...updOt }));
  }

  async function deleteFoto(id: string) {
    await supabase.from("fotos_ot").delete().eq("id", id);
    setFotos(prev => prev.filter(f => f.id !== id));
  }

  function sharePresupuesto() {
    if (navigator.share) {
      navigator.share({ title: `Presupuesto OT #${ot.numero_ot}`, url: presupuestoUrl });
    } else {
      navigator.clipboard.writeText(presupuestoUrl);
      alert("Link copiado al portapapeles");
    }
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center border border-border shrink-0">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted font-mono">OT #{ot.numero_ot}</p>
          <h1 className="text-lg font-bold truncate">{ot.vehiculo?.patente} — {ot.vehiculo?.marca} {ot.vehiculo?.modelo}</h1>
        </div>
        <EstadoBadge estado={ot.estado} />
      </div>

      <div className="px-4 space-y-4">
        {/* Info vehículo */}
        <div className="card">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <InfoRow label="Patente" value={ot.vehiculo?.patente ?? "—"} mono />
            <InfoRow label="Año" value={ot.vehiculo?.anio?.toString() ?? "—"} />
            <InfoRow label="Cliente" value={ot.vehiculo?.cliente_nombre ?? "—"} />
            <InfoRow label="Kms" value={ot.vehiculo?.kms_actuales ? `${ot.vehiculo.kms_actuales.toLocaleString()} km` : "—"} />
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-muted mb-1">Problema reportado</p>
            <p className="text-sm text-white">{ot.descripcion_problema}</p>
          </div>
        </div>

        {/* Cambiar estado */}
        <div className="card">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Cambiar estado</p>
          <div className="flex gap-2 flex-wrap">
            {ESTADOS.filter(e => e !== ot.estado).map(e => (
              <button
                key={e}
                onClick={() => cambiarEstado(e)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-white hover:bg-surface-2 active:scale-95 transition-all"
              >
                {ESTADO_LABEL[e]}
              </button>
            ))}
          </div>
        </div>

        {/* Presupuesto link */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Presupuesto cliente</p>
            {ot.aprobado_por_cliente && (
              <span className="text-xs text-success font-semibold">✓ Aprobado</span>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text-muted font-mono truncate">
              /p/{ot.link_token?.slice(0, 16)}...
            </div>
            <button onClick={sharePresupuesto} className="btn-primary px-4 py-2 text-xs">
              Compartir
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Trabajos y repuestos</p>
            <button onClick={() => setAddingItem(true)} className="text-primary text-xs font-semibold">+ Agregar</button>
          </div>

          {items.length === 0 && !addingItem && (
            <p className="text-sm text-text-muted py-2">Sin ítems aún</p>
          )}

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium shrink-0 ${
                  item.tipo === "trabajo" ? "bg-primary-dim text-primary" : "bg-warning-dim text-warning"
                }`}>{item.tipo === "trabajo" ? "Trabajo" : "Repuesto"}</span>
                <span className="flex-1 text-sm text-white truncate">{item.descripcion}</span>
                <span className="text-sm text-text-secondary shrink-0">{item.cantidad}x</span>
                <span className="text-sm font-semibold text-white shrink-0">{formatCLP(item.subtotal)}</span>
                <button onClick={() => deleteItem(item.id)} className="text-text-muted hover:text-danger ml-1">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {addingItem && (
            <div className="mt-3 pt-3 border-t border-border space-y-3">
              <div className="flex gap-2">
                {(["trabajo", "repuesto"] as TipoItem[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewTipo(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      newTipo === t
                        ? t === "trabajo" ? "bg-primary-dim border-primary text-primary" : "bg-warning-dim border-warning text-warning"
                        : "border-border text-text-muted"
                    }`}
                  >
                    {t === "trabajo" ? "Trabajo" : "Repuesto"}
                  </button>
                ))}
              </div>
              <input className="input-field" placeholder="Descripción" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field" placeholder="Cant." type="number" value={newCant} onChange={e => setNewCant(e.target.value)} min="0.01" step="0.01" />
                <input className="input-field" placeholder="Precio unit." type="number" value={newPrecio} onChange={e => setNewPrecio(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddingItem(false)} className="btn-secondary flex-1 py-2 text-sm">Cancelar</button>
                <button onClick={addItem} className="btn-primary flex-1 py-2 text-sm">Agregar</button>
              </div>
            </div>
          )}

          {/* Totales */}
          {items.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Neto</span><span>{formatCLP(ot.monto_neto)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary">
                <span>IVA (19%)</span><span>{formatCLP(ot.monto_iva)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white">
                <span>Total</span><span>{formatCLP(ot.monto_total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Fotos diagnóstico */}
        <div className="card">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Fotos de diagnóstico ({fotosD.length}/4)
          </p>
          {fotosD.length > 0 && (
            <div className="mb-3">
              <FotoGrid fotos={fotosD} onDelete={deleteFoto} />
            </div>
          )}
          <FotoUploader otId={ot.id} tipo="diagnostico" count={fotosD.length} onUploaded={refreshFotos} />
        </div>

        {/* Fotos salida — solo si estado es listo o cerrado */}
        {(ot.estado === "listo" || ot.estado === "cerrado") && (
          <div className="card">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Fotos de salida ({fotosS.length}/4)
            </p>
            {fotosS.length > 0 && (
              <div className="mb-3">
                <FotoGrid fotos={fotosS} onDelete={deleteFoto} />
              </div>
            )}
            <FotoUploader otId={ot.id} tipo="salida" count={fotosS.length} onUploaded={refreshFotos} />
          </div>
        )}

        {/* Cerrar OT */}
        {ot.estado !== "cerrado" && (
          <button
            onClick={() => cambiarEstado("cerrado")}
            disabled={loading}
            className="btn-danger w-full"
          >
            Cerrar OT
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-sm text-white font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
