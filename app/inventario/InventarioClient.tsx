"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Inventario } from "@/types/database";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export default function InventarioClient({ items: initialItems, tallerId }: { items: Inventario[]; tallerId: string }) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nombre: "", codigo_ref: "", categoria: "", stock_actual: "", stock_minimo: "1", precio_unitario: "", proveedor: "" });
  const [saving, setSaving] = useState(false);

  const bajosStock = items.filter(i => i.stock_actual <= i.stock_minimo);

  async function addItem() {
    setSaving(true);
    const { data } = await supabase.from("inventario").insert({
      taller_id: tallerId,
      nombre: form.nombre,
      codigo_ref: form.codigo_ref,
      categoria: form.categoria,
      stock_actual: parseInt(form.stock_actual) || 0,
      stock_minimo: parseInt(form.stock_minimo) || 1,
      precio_unitario: parseInt(form.precio_unitario) || 0,
      proveedor: form.proveedor,
    }).select().single();
    if (data) setItems(prev => [...prev, data]);
    setForm({ nombre: "", codigo_ref: "", categoria: "", stock_actual: "", stock_minimo: "1", precio_unitario: "", proveedor: "" });
    setAdding(false);
    setSaving(false);
  }

  async function updateStock(id: string, delta: number) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock_actual + delta);
    await supabase.from("inventario").update({ stock_actual: newStock }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, stock_actual: newStock } : i));
  }

  async function deleteItem(id: string) {
    await supabase.from("inventario").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div className="px-4 space-y-4">
      {bajosStock.length > 0 && (
        <div className="bg-warning-dim border border-warning/20 rounded-2xl p-4">
          <p className="text-warning text-sm font-semibold mb-2">⚠️ {bajosStock.length} ítem(s) con stock bajo</p>
          {bajosStock.map(i => (
            <p key={i.id} className="text-xs text-warning/70">{i.nombre}: {i.stock_actual}/{i.stock_minimo}</p>
          ))}
        </div>
      )}

      <button onClick={() => setAdding(true)} className="btn-primary w-full">+ Agregar ítem</button>

      {adding && (
        <div className="card space-y-3">
          <p className="text-sm font-semibold">Nuevo ítem</p>
          <input className="input-field" placeholder="Nombre *" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder="Código ref." value={form.codigo_ref} onChange={e => setForm(p => ({ ...p, codigo_ref: e.target.value }))} />
            <input className="input-field" placeholder="Categoría" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} />
            <input className="input-field" placeholder="Stock actual" type="number" value={form.stock_actual} onChange={e => setForm(p => ({ ...p, stock_actual: e.target.value }))} />
            <input className="input-field" placeholder="Stock mínimo" type="number" value={form.stock_minimo} onChange={e => setForm(p => ({ ...p, stock_minimo: e.target.value }))} />
            <input className="input-field" placeholder="Precio unit." type="number" value={form.precio_unitario} onChange={e => setForm(p => ({ ...p, precio_unitario: e.target.value }))} />
            <input className="input-field" placeholder="Proveedor" value={form.proveedor} onChange={e => setForm(p => ({ ...p, proveedor: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={addItem} disabled={!form.nombre || saving} className="btn-primary flex-1">Guardar</button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding ? (
        <div className="card text-center py-10">
          <p className="text-text-muted text-sm">Sin ítems en inventario</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const bajo = item.stock_actual <= item.stock_minimo;
            return (
              <div key={item.id} className={`card ${bajo ? "border-warning/30" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white">{item.nombre}</p>
                    {item.codigo_ref && <p className="text-xs text-text-muted font-mono">{item.codigo_ref}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {bajo && <span className="text-xs text-warning font-semibold">Stock bajo</span>}
                    <button onClick={() => deleteItem(item.id)} className="text-text-muted hover:text-danger">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateStock(item.id, -1)} className="w-7 h-7 rounded-lg bg-surface border border-border text-white flex items-center justify-center text-lg">−</button>
                    <span className={`font-bold ${bajo ? "text-warning" : "text-white"}`}>{item.stock_actual}</span>
                    <button onClick={() => updateStock(item.id, 1)} className="w-7 h-7 rounded-lg bg-surface border border-border text-white flex items-center justify-center text-lg">+</button>
                    <span className="text-xs text-text-muted">/ mín {item.stock_minimo}</span>
                  </div>
                  <span className="text-sm text-text-secondary">{formatCLP(item.precio_unitario)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
