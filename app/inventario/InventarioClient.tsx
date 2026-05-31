"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Inventario } from "@/types/database";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

const EMPTY_FORM = {
  nombre: "",
  codigo_ref: "",
  categoria: "",
  stock_actual: "",
  stock_minimo: "1",
  precio_unitario: "",
  proveedor: "",
};

export default function InventarioClient({
  items: initialItems,
  tallerId,
}: {
  items: Inventario[];
  tallerId: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterBajo, setFilterBajo] = useState(false);

  const bajosStock = items.filter((i) => i.stock_actual <= i.stock_minimo);

  const visible = useMemo(() => {
    let list = items;
    if (filterBajo) list = list.filter((i) => i.stock_actual <= i.stock_minimo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.nombre.toLowerCase().includes(q) ||
          i.codigo_ref?.toLowerCase().includes(q) ||
          i.categoria?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, search, filterBajo]);

  async function addItem() {
    if (!form.nombre) return;
    setSaving(true);
    const { data } = await supabase
      .from("inventario")
      .insert({
        taller_id: tallerId,
        nombre: form.nombre,
        codigo_ref: form.codigo_ref,
        categoria: form.categoria,
        stock_actual: parseInt(form.stock_actual) || 0,
        stock_minimo: parseInt(form.stock_minimo) || 1,
        precio_unitario: parseInt(form.precio_unitario) || 0,
        proveedor: form.proveedor,
      })
      .select()
      .single();
    if (data) setItems((prev) => [data, ...prev]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  }

  async function updateStock(id: string, delta: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock_actual + delta);
    await supabase.from("inventario").update({ stock_actual: newStock }).eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stock_actual: newStock } : i)));
  }

  async function deleteItem(id: string) {
    await supabase.from("inventario").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="px-4 space-y-4">
      {/* ── ALERTA STOCK BAJO ── */}
      {bajosStock.length > 0 && (
        <button
          onClick={() => setFilterBajo((v) => !v)}
          className="w-full rounded-2xl px-4 py-3 flex items-center justify-between text-left active:scale-[0.99] transition-transform"
          style={{
            background: filterBajo ? "rgba(255,176,32,0.12)" : "rgba(255,176,32,0.07)",
            border: `1px solid ${filterBajo ? "rgba(255,176,32,0.3)" : "rgba(255,176,32,0.18)"}`,
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#FFB020" }}>
                {bajosStock.length} ítem{bajosStock.length !== 1 ? "s" : ""} con stock bajo
              </p>
              <p className="text-xs" style={{ color: "rgba(255,176,32,0.55)" }}>
                {filterBajo ? "Mostrando solo alertas" : "Toca para filtrar"}
              </p>
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ transform: filterBajo ? "rotate(180deg)" : "none", transition: "transform .2s" }}
          >
            <path d="M4 6l4 4 4-4" stroke="#FFB020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* ── BUSCADOR + AGREGAR ── */}
      <div className="flex gap-2">
        <div
          className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" />
            <path d="M9.5 9.5l2.5 2.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
            placeholder="Buscar nombre, código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/30 hover:text-white/60">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #1A6BFF 0%, #0052e0 100%)",
            boxShadow: "0 4px 16px rgba(26,107,255,0.3)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Agregar
        </button>
      </div>

      {/* ── FORMULARIO NUEVO ÍTEM ── */}
      {showForm && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "linear-gradient(145deg, rgba(26,29,46,0.95) 0%, rgba(18,20,31,0.98) 100%)",
            border: "1px solid rgba(26,107,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Nuevo ítem de inventario</p>
            <button onClick={() => setShowForm(false)} style={{ color: "rgba(255,255,255,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div>
            <label className="label">Nombre *</label>
            <input
              className="input-field"
              placeholder="Ej: Filtro de aceite Toyota"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label">Código ref.</label>
              <input
                className="input-field"
                placeholder="OIL-1234"
                value={form.codigo_ref}
                onChange={(e) => setForm((p) => ({ ...p, codigo_ref: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Categoría</label>
              <input
                className="input-field"
                placeholder="Filtros"
                value={form.categoria}
                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Stock actual</label>
              <input
                className="input-field"
                placeholder="0"
                type="number"
                min="0"
                value={form.stock_actual}
                onChange={(e) => setForm((p) => ({ ...p, stock_actual: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Stock mínimo</label>
              <input
                className="input-field"
                placeholder="1"
                type="number"
                min="0"
                value={form.stock_minimo}
                onChange={(e) => setForm((p) => ({ ...p, stock_minimo: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Precio unit.</label>
              <input
                className="input-field"
                placeholder="$0"
                type="number"
                min="0"
                value={form.precio_unitario}
                onChange={(e) => setForm((p) => ({ ...p, precio_unitario: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Proveedor</label>
              <input
                className="input-field"
                placeholder="AutoParts"
                value={form.proveedor}
                onChange={(e) => setForm((p) => ({ ...p, proveedor: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Cancelar
            </button>
            <button
              onClick={addItem}
              disabled={!form.nombre || saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #1A6BFF 0%, #0052e0 100%)",
                boxShadow: "0 4px 16px rgba(26,107,255,0.25)",
              }}
            >
              {saving ? "Guardando…" : "Guardar ítem"}
            </button>
          </div>
        </div>
      )}

      {/* ── LISTA VACÍA ── */}
      {visible.length === 0 && !showForm && (
        <div
          className="rounded-2xl p-10 flex flex-col items-center text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "rgba(26,107,255,0.08)", border: "1px solid rgba(26,107,255,0.12)" }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="4" width="18" height="14" rx="3" stroke="#1A6BFF" strokeWidth="1.4"/>
              <path d="M7 9h8M7 13h5" stroke="#1A6BFF" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            {search || filterBajo ? "Sin resultados" : "Inventario vacío"}
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {search || filterBajo ? "Prueba con otro filtro" : "Agrega tu primer ítem de repuesto"}
          </p>
        </div>
      )}

      {/* ── ITEMS ── */}
      <div className="space-y-2.5">
        {visible.map((item) => (
          <InventarioItem
            key={item.id}
            item={item}
            onIncrement={() => updateStock(item.id, 1)}
            onDecrement={() => updateStock(item.id, -1)}
            onDelete={() => deleteItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── InventarioItem ── */
function InventarioItem({
  item,
  onIncrement,
  onDecrement,
  onDelete,
}: {
  item: Inventario;
  onIncrement: () => void;
  onDecrement: () => void;
  onDelete: () => void;
}) {
  const bajo = item.stock_actual <= item.stock_minimo;
  const pct = item.stock_minimo > 0
    ? Math.min(100, Math.round((item.stock_actual / (item.stock_minimo * 2)) * 100))
    : 100;

  const barColor = bajo ? "#FFB020" : item.stock_actual >= item.stock_minimo * 1.5 ? "#00D68F" : "#1A6BFF";

  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(26,29,46,0.85) 0%, rgba(18,20,31,0.9) 100%)",
        border: `1px solid ${bajo ? "rgba(255,176,32,0.2)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: bajo ? "0 0 0 1px rgba(255,176,32,0.08) inset" : "none",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white leading-tight">{item.nombre}</p>
            {item.categoria && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: "rgba(26,107,255,0.12)", color: "rgba(26,107,255,0.8)" }}
              >
                {item.categoria}
              </span>
            )}
          </div>
          {item.codigo_ref && (
            <p className="text-[11px] mt-0.5 font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
              {item.codigo_ref}
            </p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "rgba(255,255,255,0.2)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FF4757")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 3h9M4.5 3V2a1 1 0 012 0v1M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Barra de stock */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
            Stock
          </span>
          {bajo && (
            <span className="text-[10px] font-bold" style={{ color: "#FFB020" }}>
              ⚠ Bajo mínimo ({item.stock_minimo})
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Controls + precio */}
      <div className="flex items-center justify-between">
        {/* Stepper */}
        <div
          className="flex items-center gap-0 rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
        >
          <button
            onClick={onDecrement}
            disabled={item.stock_actual <= 0}
            className="w-9 h-9 flex items-center justify-center text-lg font-light transition-colors disabled:opacity-30"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            −
          </button>
          <span
            className="w-10 text-center text-base font-bold"
            style={{ color: bajo ? "#FFB020" : "#fff" }}
          >
            {item.stock_actual}
          </span>
          <button
            onClick={onIncrement}
            className="w-9 h-9 flex items-center justify-center text-lg font-light transition-colors"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            +
          </button>
        </div>

        {/* Precio y proveedor */}
        <div className="text-right">
          {item.precio_unitario > 0 && (
            <p className="text-sm font-bold text-white">{formatCLP(item.precio_unitario)}</p>
          )}
          {item.proveedor && (
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              {item.proveedor}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
