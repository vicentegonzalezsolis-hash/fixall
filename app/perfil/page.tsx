"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";

function PerfilForm() {
  const supabase = createClient();
  const router = useRouter();
  const sp = useSearchParams();
  const isSetup = sp.get("setup") === "true";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tallerId, setTallerId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [horario, setHorario] = useState("");
  const [especialidades, setEspecialidades] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: t } = await supabase.from("talleres").select("*").eq("user_id", user.id).single();
      if (t) {
        setTallerId(t.id);
        setNombre(t.nombre); setRut(t.rut); setDireccion(t.direccion);
        setComuna(t.comuna); setTelefono(t.telefono); setWhatsapp(t.whatsapp);
        setHorario(t.horario ?? ""); setEspecialidades((t.especialidades ?? []).join(", "));
      }
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      nombre, rut, direccion, comuna, telefono, whatsapp, horario,
      especialidades: especialidades.split(",").map(s => s.trim()).filter(Boolean),
      user_id: user.id,
    };

    if (tallerId) {
      await supabase.from("talleres").update(payload).eq("id", tallerId);
    } else {
      const { data } = await supabase.from("talleres").insert(payload).select().single();
      if (data) setTallerId(data.id);
    }
    setSaving(false);
    if (isSetup) router.push("/dashboard");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="pb-24">
      <div className="px-4 pt-12 pb-6">
        <Logo size="sm" className="mb-4" />
        <div className="flex items-center gap-3">
          {!isSetup && (
            <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center border border-border shrink-0">
              <ChevronLeft size={18} color="#FAFAFA" strokeWidth={1.8} />
            </Link>
          )}
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#FAFAFA" }}>{isSetup ? "Configura tu taller" : "Perfil del taller"}</h1>
              {isSetup && <p className="text-xs text-text-muted">Completa los datos para continuar</p>}
            </div>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-5">
        <div className="card space-y-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Datos del taller</p>
          <div><label className="label">Nombre del taller *</label><input className="input-field" placeholder="Taller Don Carlos" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
          <div><label className="label">RUT</label><input className="input-field" placeholder="76.123.456-7" value={rut} onChange={e => setRut(e.target.value)} /></div>
          <div><label className="label">Dirección *</label><input className="input-field" placeholder="Av. Principal 1234" value={direccion} onChange={e => setDireccion(e.target.value)} required /></div>
          <div><label className="label">Comuna *</label><input className="input-field" placeholder="Santiago" value={comuna} onChange={e => setComuna(e.target.value)} required /></div>
          <div><label className="label">Teléfono</label><input className="input-field" placeholder="+562 2345 6789" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} /></div>
          <div><label className="label">WhatsApp *</label><input className="input-field" placeholder="+56912345678" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required /></div>
          <div><label className="label">Horario</label><input className="input-field" placeholder="Lun-Vie 8:00-18:00" value={horario} onChange={e => setHorario(e.target.value)} /></div>
          <div><label className="label">Especialidades</label><input className="input-field" placeholder="Mecánica general, eléctrico, frenos" value={especialidades} onChange={e => setEspecialidades(e.target.value)} /><p className="text-xs text-text-muted mt-1">Separadas por coma</p></div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-base">
          {saving ? "Guardando..." : isSetup ? "Comenzar con Fixall" : "Guardar cambios"}
        </button>

        {!isSetup && (
          <button type="button" onClick={handleSignOut} className="btn-secondary w-full py-3 text-sm text-danger border-danger/20">
            Cerrar sesión
          </button>
        )}
      </form>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Cargando...</div>}>
      <PerfilForm />
      <BottomNav />
    </Suspense>
  );
}
