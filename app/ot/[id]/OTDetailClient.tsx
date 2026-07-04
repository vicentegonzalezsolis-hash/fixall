"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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

  const fotosRecepcion = fotos.filter(f => f.tipo === "recepcion");
  const fotosProceso = fotos.filter(f => f.tipo === "proceso");
  const fotosEntrega = fotos.filter(f => f.tipo === "entrega");

  // Siempre usar dominio completo: env var de build > origin real del browser
  // Se evalúa en render (browser), así window.location.origin nunca es undefined
  const appBase =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) ||
    window.location.origin;
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
          style={{ background: "#111827", border: "1px solid #1a2a3a" }}
        >
          <ChevronLeft size={18} color="#FAFAFA" strokeWidth={1.8} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono" style={{ color: "#555555" }}>OT #{ot.numero_ot}</p>
          <h1 className="text-lg font-bold truncate" style={{ color: "#FAFAFA" }}>
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
                style={{ background: "#111827", border: "1px solid #1a2a3a" }}
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
              <span className="text-xs font-bold" style={{ color: "#10B981" }}>✓ Aprobado</span>
            )}
          </div>
          <div className="flex gap-2">
            <div
              className="flex-1 rounded-xl px-3 py-2 text-xs font-mono truncate"
              style={{ background: "#111827", border: "1px solid #1a2a3a", color: "#555555" }}
            >
              {presupuestoUrl.replace(/^https?:\/\//, "").slice(0, 32)}…
            </div>
            <button
              onClick={sharePresupuesto}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: "#1E466B", color: "#67BAF4" }}
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
                style={{ color: "#67BAF4" }}
              >
                + Agregar
              </button>
            )}
          </div>

          {items.length === 0 && !addingItem && (
            <p className="text-sm py-2" style={{ color: "#555555" }}>Sin ítems aún</p>
          )}

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-lg font-medium shrink-0"
                  style={
                    item.tipo === "trabajo"
                      ? { background: "rgba(103,186,244,0.12)", color: "#67BAF4" }
                      : { background: "rgba(245,158,11,0.12)", color: "#F59E0B" }
                  }
                >
                  {item.tipo === "trabajo" ? "Trabajo" : "Repuesto"}
                </span>
                <span className="flex-1 text-sm text-white truncate">{item.descripcion}</span>
                <span className="text-sm shrink-0" style={{ color: "#555555" }}>{item.cantidad}×</span>
                <span className="text-sm font-semibold text-white shrink-0">{formatCLP(item.subtotal)}</span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="ml-1"
                  style={{ color: "#555555" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#555555")}
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
              style={{ borderTop: "1px solid #1a2a3a" }}
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
                          ? { background: "rgba(103,186,244,0.15)", border: "1px solid rgba(103,186,244,0.35)", color: "#67BAF4" }
                          : { background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#F59E0B" }
                        : { background: "#111827", border: "1px solid #1a2a3a", color: "#555555" }
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
                    style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}
                  >
                    ✓ del inventario
                  </span>
                )}

                {/* Dropdown autocomplete */}
                {showInvDrop && invSugerencias.length > 0 && (
                  <div
                    className="absolute z-30 top-full mt-1.5 w-full rounded-xl overflow-hidden shadow-2xl"
                    style={{ background: "#111827", border: "1px solid #1a2a3a" }}
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
                                <span className="text-[10px] font-mono" style={{ color: "#555555" }}>
                                  {item.codigo_ref}
                                </span>
                              )}
                              <span
                                className="text-[10px] font-semibold"
                                style={{ color: bajo ? "#F59E0B" : "rgba(16,185,129,0.7)" }}
                              >
                                Stock: {item.stock_actual}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-bold ml-3 shrink-0" style={{ color: "#67BAF4" }}>
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
                    style={selectedInvId ? { borderColor: "rgba(103,186,244,0.3)" } : {}}
                  />
                  {selectedInvId && newPrecio && (
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
                      style={{ color: "#67BAF4" }}
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
                  style={{ background: "#111827", border: "1px solid #1a2a3a" }}
                >
                  <span style={{ color: "#555555" }}>Subtotal:</span>
                  <span className="font-bold text-white">
                    {formatCLP(parseFloat(newCant) * parseInt(newPrecio))}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setAddingItem(false); setNewDesc(""); setNewPrecio(""); setSelectedInvId(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#111827", border: "1px solid #1a2a3a", color: "#555555" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={addItem}
                  disabled={!newDesc || !newPrecio}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                  style={{ background: "#1E466B", color: "#67BAF4" }}
                >
                  Agregar
                </button>
              </div>
            </div>
          )}

          {/* Totales */}
          {items.length > 0 && (
            <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: "1px solid #1a2a3a" }}>
              <div className="flex justify-between text-sm" style={{ color: "#555555" }}>
                <span>Neto</span><span>{formatCLP(ot.monto_neto)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "#555555" }}>
                <span>IVA (19%)</span><span>{formatCLP(ot.monto_iva)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-1" style={{ borderTop: "1px solid #1a2a3a" }}>
                <span>Total</span><span>{formatCLP(ot.monto_total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Fotos recepción */}
        <div className="card">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Recepción ({fotosRecepcion.length}/4)
          </p>
          {fotosRecepcion.length > 0 && (
            <div className="mb-3"><FotoGrid fotos={fotosRecepcion} onDelete={deleteFoto} /></div>
          )}
          <FotoUploader otId={ot.id} tipo="recepcion" count={fotosRecepcion.length} onUploaded={refreshFotos} />
        </div>

        {/* Fotos en proceso */}
        <div className="card">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            En proceso ({fotosProceso.length}/4)
          </p>
          {fotosProceso.length > 0 && (
            <div className="mb-3"><FotoGrid fotos={fotosProceso} onDelete={deleteFoto} /></div>
          )}
          <FotoUploader otId={ot.id} tipo="proceso" count={fotosProceso.length} onUploaded={refreshFotos} />
        </div>

        {/* Fotos entrega */}
        <div className="card">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Entrega ({fotosEntrega.length}/4)
          </p>
          {fotosEntrega.length > 0 && (
            <div className="mb-3"><FotoGrid fotos={fotosEntrega} onDelete={deleteFoto} /></div>
          )}
          <FotoUploader otId={ot.id} tipo="entrega" count={fotosEntrega.length} onUploaded={refreshFotos} />
        </div>

        {ot.estado !== "cerrado" && (
          <button
            onClick={() => cambiarEstado("cerrado")}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}
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
      <p className="text-xs" style={{ color: "#555555" }}>{label}</p>
      <p className={`text-sm text-white font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
