"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import { Mail, Check } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg overflow-hidden relative">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(103,186,244,0.16) 0%, transparent 68%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[220px] h-[220px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)" }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 relative z-10">

        {/* ── LOGO DE MARCA ── */}
        <div className="mb-10 flex flex-col items-center gap-5">
          <Logo size="lg" />

          {/* Tagline con divider */}
          <div className="flex items-center gap-3">
            <div className="h-px w-10" style={{ background: "#1a2a3a" }} />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#555555" }}>
              Gestión de talleres
            </p>
            <div className="h-px w-10" style={{ background: "#1a2a3a" }} />
          </div>
        </div>

        {/* ── CARD ── */}
        <div
          className="w-full rounded-3xl p-6"
          style={{
            background: "#111827",
            border: "1px solid #1a2a3a",
          }}
        >
          {!sent ? (
            <>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#FAFAFA" }}>Iniciar sesión</h2>
              <p className="text-sm mb-6" style={{ color: "#555555" }}>
                Te enviamos un link de acceso instantáneo a tu email
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-xs font-semibold mb-2 uppercase tracking-widest"
                    style={{ color: "#555555" }}
                  >
                    Email del taller
                  </label>
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{ background: "#111827", border: "1px solid #1a2a3a" }}
                  >
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Mail size={15} color="#555555" strokeWidth={1.4} />
                    </div>
                    <input
                      type="email"
                      className="w-full bg-transparent pl-10 pr-4 py-3.5 text-sm outline-none"
                      style={{ caretColor: "#67BAF4", color: "#FAFAFA" }}
                      placeholder="taller@ejemplo.cl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#EF4444",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
                  style={{ background: "#1E466B", color: "#67BAF4" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      Enviando…
                    </span>
                  ) : (
                    "Enviar link de acceso →"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <Check size={30} color="#10B981" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "#FAFAFA" }}>Revisa tu email</h2>
              <p className="text-sm" style={{ color: "#555555" }}>
                Enviamos el link de acceso a
              </p>
              <p className="text-sm font-semibold mt-0.5 mb-5" style={{ color: "#FAFAFA" }}>{email}</p>
              <div
                className="rounded-xl px-4 py-3 text-xs text-left mb-5"
                style={{
                  background: "rgba(103,186,244,0.06)",
                  border: "1px solid rgba(103,186,244,0.12)",
                  color: "#555555",
                }}
              >
                El link expira en 1 hora · Revisa también tu carpeta de spam
              </div>
              <button
                className="text-sm font-medium active:scale-95 transition-transform"
                style={{ color: "#555555" }}
                onClick={() => setSent(false)}
              >
                ← Usar otro email
              </button>
            </div>
          )}
        </div>

        {/* ── FEATURES ── */}
        <div className="mt-7 grid grid-cols-3 gap-2.5 w-full">
          {[
            { icon: "🔧", label: "OTs digitales" },
            { icon: "📱", label: "Aprobación online" },
            { icon: "💬", label: "Aviso WhatsApp" },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-2xl p-3 text-center"
              style={{
                background: "#111827",
                border: "1px solid #1a2a3a",
              }}
            >
              <p className="text-lg mb-1">{f.icon}</p>
              <p
                className="text-[10px] font-semibold leading-tight"
                style={{ color: "#555555" }}
              >
                {f.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] pb-8 relative z-10" style={{ color: "#555555" }}>
        Solo para talleres registrados en Fixall
      </p>
    </div>
  );
}
