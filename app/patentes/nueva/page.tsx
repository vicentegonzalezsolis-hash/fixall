"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";

function NuevaPatentForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tallerId, setTallerId] = useState("");

  const [patente, setPatente] = useState(sp.get("patente") ?? "");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [color, setColor] = useState("");
  const [kms, setKms] = useState("");
  const [aceite, setAceite] = useState("");
  const [motor, setMotor] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteWA, setClienteWA] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    supabase.from("talleres").select("id").then(({ data }) => {
      if (data?.[0]) setTallerId(data[0].id);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tallerId) return;
    setLoading(true);
    setError("");

    const { error: err } = await supabase.from("vehiculos").insert({
      patente: patente.toUpperCase().trim(),
      marca, modelo,
      anio: anio ? parseInt(anio) : null,
      color, kms_actuales: kms ? parseInt(kms) : 0,
      aceite_recomendado: aceite,
      numero_motor: motor,
      taller_id: tallerId,
      cliente_nombre: clienteNombre,
      cliente_whatsapp: clienteWA,
      notas_internas: notas,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/patentes");
    }
  }

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <Link href="/patentes" className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center border border-border">
          <ChevronLeft size={18} color="#FAFAFA" strokeWidth={1.8} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "#FAFAFA" }}>Nuevo Vehículo</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-5">
        <div>
          <label className="label">Patente *</label>
          <input className="input-field uppercase" placeholder="ABCD12" value={patente} onChange={e => setPatente(e.target.value.toUpperCase())} required maxLength={8} />
        </div>

        <div className="card space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Datos del vehículo</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Marca</label><input className="input-field" placeholder="Toyota" value={marca} onChange={e => setMarca(e.target.value)} /></div>
            <div><label className="label">Modelo</label><input className="input-field" placeholder="Corolla" value={modelo} onChange={e => setModelo(e.target.value)} /></div>
            <div><label className="label">Año</label><input className="input-field" placeholder="2020" type="number" value={anio} onChange={e => setAnio(e.target.value)} /></div>
            <div><label className="label">Color</label><input className="input-field" placeholder="Blanco" value={color} onChange={e => setColor(e.target.value)} /></div>
            <div><label className="label">Kms actuales</label><input className="input-field" placeholder="85000" type="number" value={kms} onChange={e => setKms(e.target.value)} /></div>
            <div><label className="label">Aceite rec.</label><input className="input-field" placeholder="5W-30" value={aceite} onChange={e => setAceite(e.target.value)} /></div>
          </div>
          <div><label className="label">N° motor</label><input className="input-field" placeholder="1NZ-FE123456" value={motor} onChange={e => setMotor(e.target.value)} /></div>
        </div>

        <div className="card space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Datos del cliente</p>
          <div><label className="label">Nombre *</label><input className="input-field" placeholder="Juan Pérez" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} required /></div>
          <div><label className="label">WhatsApp</label><input className="input-field" placeholder="+56912345678" type="tel" value={clienteWA} onChange={e => setClienteWA(e.target.value)} /></div>
          <div><label className="label">Notas internas</label><textarea className="input-field resize-none" rows={2} placeholder="Observaciones del vehículo..." value={notas} onChange={e => setNotas(e.target.value)} /></div>
        </div>

        {error && <div className="bg-danger-dim border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
          {loading ? "Guardando..." : "Registrar vehículo"}
        </button>
      </form>
    </div>
  );
}

export default function NuevaPatentePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Cargando...</div>}>
      <NuevaPatentForm />
    </Suspense>
  );
}
