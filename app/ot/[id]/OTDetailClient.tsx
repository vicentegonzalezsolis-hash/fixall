"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import EstadoBadge from "@/components/EstadoBadge";
import FotoGrid from "@/components/FotoGrid";
import FotoUploader from "@/components/FotoUploader";
import { OrdenTrabajo, Taller, ItemOT, FotoOT, EstadoOT, TipoItem, Inventario } from "@/types/database";

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
  const supabase = createClient();
  const [ot, setOt] = useState(initialOt);
  const [items, setItems] = useState<ItemOT[]>((initialOt.items as ItemOT[]) ?? []);
  const [fotos, setFotos] = useState<FotoOT[]>((initialOt.fotos as FotoOT[]) ?? []);
  const [loading, setLoading] = useState(false);

  // Form nuevo ítem
  const [addingItem, setAddingItem] = useState(false);
  const [newTipo, setNewTipo] = useState<TipoItem>("trabajo");
  const [newDesc, setNewDesc] = useState("");
  const [newCant, setNewCant] = useState("1");
  const [newPrecio, setNewPrecio] = useState("");

  // Autocomplete inventario
  const [invSugerencias, setInvSugerencias] = useState<Inventario[]>([]);
  const [showInvDrop, setShowInvDrop] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fotosD = fotos.filter(f => f.tipo === "diagnostico");
  const fotosS = fotos.filter(f => f.tipo === "salida");
  const appBase =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const presupuestoUrl = `${appBase}/p/${ot.link_token}`;

  // Buscar en inventario cuando tipo = repuesto y hay texto
  useEffect(() => {
    if (newTipo !== "repuesto" || newDesc.length < 2) {
      setInvSugerencias([]);
      setShowInvDrop(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("inventario")
        .select("*")
        .eq("taller_id", taller.id)
        .ilike("nombre", `%${newDesc}%`)
        .limit(6);
      setInvSugerencias(data ?? []);
      setShowInvDrop(true);
    }, 250);
  }, [newDesc, newTipo]);

  function selectInventarioItem(item: Inventario) {
    setNewDesc(item.nombre);
    setNewPrecio(item.precio_unitario.toString());
    setSelectedInvId(item.id);
    setInvSugerencias([]);
    setShowInvDrop(false);
  }

  async function refreshFotos() {
    const { data } = await supabase.from("fotos_ot").select("*").eq("ot_id", ot.id);
    setFotos(data ?? []);
  }

  async function refreshTotals() {
    const { data } = await supabase
      .from("ordenes_trabajo")
      .select("monto_total, monto_neto, monto_iva")
      .eq("id", ot.id)
      .single();
    if (data) setOt(prev => ({ ...prev, ...data }));
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
      await refreshTotals();

      // Descontar del inventario si fue seleccionado por autocomplete
      if (newTipo === "repuesto") {
        const invId = selectedInvId;
        if (invId) {
          const { data: inv } = await supabase
            .from("inventario")
            .select("stock_actual")
            .eq("id", invId)
            .single();
          if (inv) {
            await supabase
              .from("inventario")
              .update({ stock_actual: Math.max(0, inv.stock_actual - parseFloat(newCant)) })
              .eq("id", invId);
          }
        } else {
          // fallback: buscar por nombre
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
    }
    setNewDesc(""); setNewCant("1"); setNewPrecio(""); setSelectedInvId(null);
    setAddingItem(false);
  }

  async function deleteItem(id: string) {
    await supabase.from("items_ot").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    await refreshTotals();
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
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>OT #{ot.numero_ot}</p>
          <h1 className="text-lg font-bold truncate">
            {ot.vehiculo?.patente} — {ot.vehiculo?.marca} {ot.vehiculo?.modelo}
          </h1>
        </div>
        <EstadoBadge estado={ot.estado} />
      </div>

      <div className="px-4 space-y-4">
        {/* Info vehículo */}
        <div className="card">
          <div className="grid grid-cols-2 gap-y-2.5 text-sm">
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
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
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
              <span className="text-xs font-bold" style={{ color: "#00D68F" }}>✓ Aprobado</span>
            )}
          </div>
          <div className="flex gap-2">
            <div
              className="flex-1 rounded-xl px-3 py-2 text-xs font-mono truncate"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}
            >
              /p/{ot.link_token?.slice(0, 16)}…
            </div>
            <button
              onClick={sharePresupuesto}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1A6BFF 0%, #0052e0 100%)" }}
            >
              Compartir
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Trabajos y repuestos</p>
            {!addingItem && (
              <button
                onClick={() => setAddingItem(true)}
                className="text-xs font-bold"
                style={{ color: "#1A6BFF" }}
              >
                + Agregar
              </button>
            )}
          </div>

          {items.length === 0 && !addingItem && (
            <p className="text-sm py-2" style={{ color: "rgba(255,255,255,0.3)" }}>Sin ítems aún</p>
          )}

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-lg font-medium shrink-0"
                  style={
                    item.tipo === "trabajo"
                      ? { background: "rgba(26,107,255,0.12)", color: "#1A6BFF" }
                      : { background: "rgba(255,176,32,0.12)", color: "#FFB020" }
                  }
                >
                  {item.tipo === "trabajo" ? "Trabajo" : "Repuesto"}
                </span>
                <span className="flex-1 text-sm text-white truncate">{item.descripcion}</span>
                <span className="text-sm shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{item.cantidad}×</span>
                <span className="text-sm font-semibold text-white shrink-0">{formatCLP(item.subtotal)}</span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="ml-1"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#FF4757")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Formulario agregar ítem */}
          {addingItem && (
            <div
              className="mt-3 pt-4 space-y-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Selector tipo */}
              <div className="flex gap-2">
                {(["trabajo", "repuesto"] as TipoItem[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setNewTipo(t); setNewDesc(""); setNewPrecio(""); setSelectedInvId(null); }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={
                      newTipo === t
                        ? t === "trabajo"
                          ? { background: "rgba(26,107,255,0.15)", border: "1px solid rgba(26,107,255,0.35)", color: "#1A6BFF" }
                          : { background: "rgba(255,176,32,0.15)", border: "1px solid rgba(255,176,32,0.35)", color: "#FFB020" }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }
                    }
                  >
                    {t === "trabajo" ? "🔧 Trabajo" : "📦 Repuesto"}
                  </button>
                ))}
              </div>

              {/* Descripción con autocomplete para repuestos */}
              <div className="relative">
                <input
                  className="input-field"
                  placeholder={newTipo === "repuesto" ? "Buscar en inventario…" : "Descripción del trabajo"}
                  value={newDesc}
                  onChange={e => { setNewDesc(e.target.value); setSelectedInvId(null); }}
                  onBlur={() => setTimeout(() => setShowInvDrop(false), 150)}
                  onFocus={() => invSugerencias.length > 0 && setShowInvDrop(true)}
                  autoComplete="off"
                />

                {/* Badge confirmación item seleccionado */}
                {selectedInvId && (
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(0,214,143,0.12)", color: "#00D68F" }}
                  >
                    ✓ del inventario
                  </span>
                )}

                {/* Dropdown autocomplete */}
                {showInvDrop && invSugerencias.length > 0 && (
                  <div
                    className="absolute z-30 top-full mt-1.5 w-full rounded-xl overflow-hidden shadow-2xl"
                    style={{ background: "#1A1D2E", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {invSugerencias.map(item => {
                      const bajo = item.stock_actual <= item.stock_minimo;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={() => selectInventarioItem(item)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.nombre}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.codigo_ref && (
                                <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                                  {item.codigo_ref}
                                </span>
                              )}
                              <span
                                className="text-[10px] font-semibold"
                                style={{ color: bajo ? "#FFB020" : "rgba(0,214,143,0.7)" }}
                              >
                                Stock: {item.stock_actual}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-bold ml-3 shrink-0" style={{ color: "#1A6BFF" }}>
                            {formatCLP(item.precio_unitario)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    className="input-field"
                    placeholder="Cantidad"
                    type="number"
                    value={newCant}
                    onChange={e => setNewCant(e.target.value)}
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="relative">
                  <input
                    className="input-field"
                    placeholder="Precio unit."
                    type="number"
                    value={newPrecio}
                    onChange={e => setNewPrecio(e.target.value)}
                    style={selectedInvId ? { borderColor: "rgba(26,107,255,0.3)" } : {}}
                  />
                  {selectedInvId && newPrecio && (
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
                      style={{ color: "rgba(26,107,255,0.6)" }}
                    >
                      precargado
                    </span>
                  )}
                </div>
              </div>

              {/* Subtotal preview */}
              {newPrecio && newCant && (
                <div
                  className="rounded-lg px-3 py-2 flex justify-between text-xs"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Subtotal:</span>
                  <span className="font-bold text-white">
                    {formatCLP(parseFloat(newCant) * parseInt(newPrecio))}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setAddingItem(false); setNewDesc(""); setNewPrecio(""); setSelectedInvId(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={addItem}
                  disabled={!newDesc || !newPrecio}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #1A6BFF 0%, #0052e0 100%)" }}
                >
                  Agregar
                </button>
              </div>
            </div>
          )}

          {/* Totales */}
          {items.length > 0 && (
            <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                <span>Neto</span><span>{formatCLP(ot.monto_neto)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                <span>IVA (19%)</span><span>{formatCLP(ot.monto_iva)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
            <div className="mb-3"><FotoGrid fotos={fotosD} onDelete={deleteFoto} /></div>
          )}
          <FotoUploader otId={ot.id} tipo="diagnostico" count={fotosD.length} onUploaded={refreshFotos} />
        </div>

        {(ot.estado === "listo" || ot.estado === "cerrado") && (
          <div className="card">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Fotos de salida ({fotosS.length}/4)
            </p>
            {fotosS.length > 0 && (
              <div className="mb-3"><FotoGrid fotos={fotosS} onDelete={deleteFoto} /></div>
            )}
            <FotoUploader otId={ot.id} tipo="salida" count={fotosS.length} onUploaded={refreshFotos} />
          </div>
        )}

        {ot.estado !== "cerrado" && (
          <button
            onClick={() => cambiarEstado("cerrado")}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ background: "rgba(255,71,87,0.15)", border: "1px solid rgba(255,71,87,0.25)", color: "#FF4757" }}
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
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
      <p className={`text-sm text-white font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
