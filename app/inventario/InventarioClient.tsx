"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Inventario } from "@/types/database";
import { Search, X, Plus, AlertTriangle, ChevronDown, Boxes } from "lucide-react";

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
            background: filterBajo ? "rgba(245,158,11,0.15)" : "#111827",
            border: "1px solid #1a2a3a",
          }}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} color="#F59E0B" />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#F59E0B" }}>
                {bajosStock.length} ítem{bajosStock.length !== 1 ? "s" : ""} con stock bajo
              </p>
              <p className="text-xs" style={{ color: "#555555" }}>
                {filterBajo ? "Mostrando solo alertas" : "Toca para filtrar"}
              </p>
            </div>
          </div>
          <ChevronDown
            size={16}
            color="#F59E0B"
            strokeWidth={1.8}
            style={{ transform: filterBajo ? "rotate(180deg)" : "none", transition: "transform .2s" }}
          />
        </button>
      )}

      {/* ── BUSCADOR + AGREGAR ── */}
      <div className="flex gap-2">
        <div
          className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "#111827", border: "1px solid #1a2a3a" }}
        >
          <Search size={14} color="#555555" strokeWidth={1.8} />
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#FAFAFA" }}
            placeholder="Buscar nombre, código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "#555555" }}>
              <X size={12} strokeWidth={1.8} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "#1E466B", color: "#67BAF4" }}
        >
          <Plus size={14} strokeWidth={2} />
          Agregar
        </button>
      </div>

      {/* ── FORMULARIO NUEVO ÍTEM ── */}
      {showForm && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "#111827", border: "1px solid #1a2a3a" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: "#FAFAFA" }}>Nuevo ítem de inventario</p>
            <button onClick={() => setShowForm(false)} style={{ color: "#555555" }}>
              <X size={16} strokeWidth={1.8} />
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
              style={{ background: "#111827", color: "#555555", border: "1px solid #1a2a3a" }}
            >
              Cancelar
            </button>
            <button
              onClick={addItem}
              disabled={!form.nombre || saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: "#1E466B", color: "#67BAF4" }}
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
          style={{ background: "#111827", border: "1px dashed #1a2a3a" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "#1E466B", border: "1px solid #67BAF4" }}
          >
            <Boxes size={22} color="#67BAF4" strokeWidth={1.4} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "#FAFAFA" }}>
            {search || filterBajo ? "Sin resultados" : "Inventario vacío"}
          </p>
          <p className="text-xs" style={{ color: "#555555" }}>
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
  const critico = item.stock_actual <= 0;
  const bajo = !critico && item.stock_actual <= item.stock_minimo;
  const pct = item.stock_minimo > 0
    ? Math.min(100, Math.round((item.stock_actual / (item.stock_minimo * 2)) * 100))
    : 100;

  const barColor = critico ? "#EF4444" : bajo ? "#F59E0B" : "#10B981";

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#111827", border: "1px solid #1a2a3a" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold leading-tight" style={{ color: "#FAFAFA" }}>{item.nombre}</p>
            {item.categoria && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: "rgba(103,186,244,0.12)", color: "#67BAF4" }}
              >
                {item.categoria}
              </span>
            )}
          </div>
          {item.codigo_ref && (
            <p className="text-[11px] mt-0.5 font-mono" style={{ color: "#555555" }}>
              {item.codigo_ref}
            </p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "#555555" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 3h9M4.5 3V2a1 1 0 012 0v1M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Barra de stock */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#555555" }}>
            Stock
          </span>
          {(bajo || critico) && (
            <span className="text-[10px] font-bold" style={{ color: barColor }}>
              ⚠ {critico ? "Sin stock" : `Bajo mínimo (${item.stock_minimo})`}
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1a2a3a" }}>
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
          style={{ border: "1px solid #1a2a3a", background: "#0D0D0D" }}
        >
          <button
            onClick={onDecrement}
            disabled={item.stock_actual <= 0}
            className="w-9 h-9 flex items-center justify-center text-lg font-light transition-colors disabled:opacity-30"
            style={{ color: "#FAFAFA" }}
          >
            −
          </button>
          <span
            className="w-10 text-center text-base font-bold"
            style={{ color: barColor }}
          >
            {item.stock_actual}
          </span>
          <button
            onClick={onIncrement}
            className="w-9 h-9 flex items-center justify-center text-lg font-light transition-colors"
            style={{ color: "#FAFAFA" }}
          >
            +
          </button>
        </div>

        {/* Precio y proveedor */}
        <div className="text-right">
          {item.precio_unitario > 0 && (
            <p className="text-sm font-bold" style={{ color: "#FAFAFA" }}>{formatCLP(item.precio_unitario)}</p>
          )}
          {item.proveedor && (
            <p className="text-[10px]" style={{ color: "#555555" }}>
              {item.proveedor}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
