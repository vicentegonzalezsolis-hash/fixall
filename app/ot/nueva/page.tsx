"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Vehiculo } from "@/types/database";

export default function NuevaOTPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tallerId, setTallerId] = useState<string>("");
  const [tallerWA, setTallerWA] = useState<string>("");

  // Patente
  const [patente, setPatente] = useState("");
  const [sugerencias, setSugerencias] = useState<Vehiculo[]>([]);
  const [vehiculoSel, setVehiculoSel] = useState<Vehiculo | null>(null);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Datos vehículo
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteWA, setClienteWA] = useState("");
  const [kms, setKms] = useState("");

  // Descripción
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    supabase
      .from("talleres")
      .select("id, whatsapp")
      .then(({ data }) => {
        if (data?.[0]) {
          setTallerId(data[0].id);
          setTallerWA(data[0].whatsapp);
        }
      });
  }, []);

  // Autocompletado patente
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (patente.length < 2 || !tallerId) {
      setSugerencias([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("vehiculos")
        .select("*")
        .eq("taller_id", tallerId)
        .ilike("patente", `%${patente}%`)
        .limit(5);
      setSugerencias(data ?? []);
      setShowSugerencias(true);
    }, 300);
  }, [patente, tallerId]);

  function selectVehiculo(v: Vehiculo) {
    setVehiculoSel(v);
    setPatente(v.patente);
    setMarca(v.marca);
    setModelo(v.modelo);
    setAnio(v.anio?.toString() ?? "");
    setClienteNombre(v.cliente_nombre);
    setClienteWA(v.cliente_whatsapp);
    setKms(v.kms_actuales?.toString() ?? "");
    setSugerencias([]);
    setShowSugerencias(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tallerId) return;
    setLoading(true);
    setError("");

    try {
      let vehiculoId = vehiculoSel?.id;

      if (!vehiculoId) {
        // Crear vehículo nuevo
        const { data: v, error: ve } = await supabase
          .from("vehiculos")
          .upsert({
            patente: patente.toUpperCase().trim(),
            marca,
            modelo,
            anio: anio ? parseInt(anio) : null,
            cliente_nombre: clienteNombre,
            cliente_whatsapp: clienteWA,
            kms_actuales: kms ? parseInt(kms) : 0,
            taller_id: tallerId,
          }, { onConflict: "patente,taller_id" })
          .select()
          .single();
        if (ve) throw ve;
        vehiculoId = v.id;
      } else {
        // Actualizar kms
        await supabase
          .from("vehiculos")
          .update({ kms_actuales: kms ? parseInt(kms) : vehiculoSel?.kms_actuales })
          .eq("id", vehiculoId);
      }

      const { data: ot, error: ote } = await supabase
        .from("ordenes_trabajo")
        .insert({
          taller_id: tallerId,
          vehiculo_id: vehiculoId,
          descripcion_problema: descripcion,
          estado: "pendiente",
        })
        .select()
        .single();
      if (ote) throw ote;

      // Enviar WhatsApp si hay número
      if (clienteWA) {
        await fetch("/api/whatsapp/presupuesto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otId: ot.id }),
        });
      }

      router.push(`/ot/${ot.id}?nuevo=true`);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Error al crear la OT");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center border border-border">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="text-lg font-bold">Nueva Orden de Trabajo</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-5">
        {/* Patente */}
        <div className="relative">
          <label className="label">Patente *</label>
          <input
            className="input-field uppercase"
            placeholder="ABCD12"
            value={patente}
            onChange={(e) => {
              setPatente(e.target.value.toUpperCase());
              setVehiculoSel(null);
            }}
            onFocus={() => sugerencias.length > 0 && setShowSugerencias(true)}
            required
            maxLength={8}
          />
          {showSugerencias && sugerencias.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-surface-2 border border-border rounded-xl overflow-hidden shadow-xl">
              {sugerencias.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectVehiculo(v)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface text-left"
                >
                  <span className="font-bold text-white text-sm font-mono">{v.patente}</span>
                  <span className="text-text-secondary text-xs">{v.marca} {v.modelo} · {v.cliente_nombre}</span>
                </button>
              ))}
              <Link
                href={`/patentes/nueva?patente=${patente}`}
                className="flex items-center gap-2 px-4 py-3 text-primary text-sm hover:bg-surface border-t border-border"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Crear vehículo nuevo
              </Link>
            </div>
          )}
        </div>

        {/* Vehículo */}
        <div className="card space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Datos del vehículo</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Marca</label>
              <input className="input-field" placeholder="Toyota" value={marca} onChange={e => setMarca(e.target.value)} />
            </div>
            <div>
              <label className="label">Modelo</label>
              <input className="input-field" placeholder="Corolla" value={modelo} onChange={e => setModelo(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Año</label>
              <input className="input-field" placeholder="2020" type="number" value={anio} onChange={e => setAnio(e.target.value)} min="1960" max="2030" />
            </div>
            <div>
              <label className="label">Kms actuales</label>
              <input className="input-field" placeholder="85000" type="number" value={kms} onChange={e => setKms(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className="card space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Datos del cliente</p>
          <div>
            <label className="label">Nombre *</label>
            <input className="input-field" placeholder="Juan Pérez" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} required />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input className="input-field" placeholder="+56912345678" type="tel" value={clienteWA} onChange={e => setClienteWA(e.target.value)} />
            <p className="text-xs text-text-muted mt-1">Se usará para enviar el presupuesto</p>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="label">Descripción del problema *</label>
          <textarea
            className="input-field min-h-[100px] resize-none"
            placeholder="Ej: Vehículo no enciende, ruido al frenar, cambio de aceite y filtros..."
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="bg-danger-dim border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4">
          {loading ? "Creando OT..." : "Crear Orden de Trabajo"}
        </button>
      </form>
    </div>
  );
}
