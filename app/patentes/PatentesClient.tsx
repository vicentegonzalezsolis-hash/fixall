"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

interface Vehiculo {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  cliente_nombre: string;
  kms_actuales: number | null;
}

export default function PatentesClient({ vehiculos }: { vehiculos: Vehiculo[] }) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    if (!search.trim()) return vehiculos;
    const q = search.toLowerCase().replace(/\s/g, "");
    return vehiculos.filter((v) =>
      v.patente.toLowerCase().replace(/\s/g, "").includes(q) ||
      v.cliente_nombre?.toLowerCase().includes(q) ||
      v.marca?.toLowerCase().includes(q) ||
      v.modelo?.toLowerCase().includes(q)
    );
  }, [vehiculos, search]);

  return (
    <div className="px-4 space-y-3">
      {/* ── BUSCADOR ── */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ background: "#111827", border: "1px solid #1a2a3a" }}
      >
        <Search size={14} color="#555555" strokeWidth={1.8} />
        <input
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#FAFAFA" }}
          placeholder="Buscar por patente, marca, cliente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoCapitalize="characters"
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ color: "#555555" }}>
            <X size={12} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* ── LISTA ── */}
      {vehiculos.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-text-muted text-sm mb-4">Sin vehículos registrados</p>
          <Link href="/patentes/nueva" className="btn-primary inline-block">Registrar vehículo</Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-text-muted text-sm">Sin resultados para <span className="text-white font-mono">"{search}"</span></p>
        </div>
      ) : (
        visible.map((v) => (
          <Link
            key={v.id}
            href={`/patentes/${v.patente}`}
            className="block card hover:border-border/50 active:scale-[0.98] transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-lg font-bold font-mono text-white">{v.patente}</span>
              <span className="text-xs text-text-muted">{v.anio}</span>
            </div>
            <p className="text-sm text-text-secondary mb-1">{v.marca} {v.modelo} · {v.color}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">{v.cliente_nombre}</p>
              <p className="text-xs text-text-muted">{v.kms_actuales?.toLocaleString()} km</p>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
