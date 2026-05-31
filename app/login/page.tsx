"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
      {/* Glow orbs de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(26,107,255,0.18) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[200px] h-[200px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,214,143,0.08) 0%, transparent 70%)" }}
        />
      </div>

      {/* Hero superior */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 relative"
            style={{
              background: "linear-gradient(135deg, rgba(26,107,255,0.2) 0%, rgba(26,107,255,0.05) 100%)",
              border: "1px solid rgba(26,107,255,0.3)",
              boxShadow: "0 0 40px rgba(26,107,255,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <path
                d="M22.5 5.5c-1.5-.4-3.5-.3-5 .5L14 8.5l3 3-1.5 1.5-3-3-3 3.5c-.8 1.5-.9 3.5-.5 5l1.5 1.5-7 7a2 2 0 000 2.8l1.2 1.2a2 2 0 002.8 0l7-7 1.5 1.5c1.5.4 3.5.3 5-.5l3.5-3-3-3 1.5-1.5 3 3 2.5-2.5c.8-1.5.9-3.5.5-5L22.5 5.5z"
                fill="#1A6BFF"
                fillOpacity="0.9"
              />
              <circle cx="10.5" cy="27.5" r="1.5" fill="#1A6BFF" fillOpacity="0.5" />
            </svg>
          </div>
          <h1
            className="text-4xl font-extrabold tracking-tight mb-1"
            style={{ background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Fixall
          </h1>
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
            Gestión para talleres mecánicos
          </p>
        </div>

        {/* Card principal */}
        <div
          className="w-full rounded-3xl p-6"
          style={{
            background: "linear-gradient(145deg, rgba(26,29,46,0.95) 0%, rgba(18,20,31,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {!sent ? (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Iniciar sesión</h2>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                Ingresa tu email y te enviamos un link de acceso instantáneo
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Email del taller
                  </label>
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="3" width="14" height="10" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3"/>
                        <path d="M1 5.5l7 4.5 7-4.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3"/>
                      </svg>
                    </div>
                    <input
                      type="email"
                      className="w-full bg-transparent pl-10 pr-4 py-3.5 text-sm text-white placeholder-white/20 outline-none"
                      style={{ caretColor: "#1A6BFF" }}
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
                    style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.2)", color: "#FF4757" }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white relative overflow-hidden active:scale-[0.98] transition-transform disabled:opacity-50"
                  style={{
                    background: loading || !email
                      ? "rgba(26,107,255,0.4)"
                      : "linear-gradient(135deg, #1A6BFF 0%, #0052e0 100%)",
                    boxShadow: email && !loading ? "0 8px 24px rgba(26,107,255,0.35)" : "none",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.2)" }}
              >
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path d="M7 15l5 5 11-10" stroke="#00D68F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Revisa tu email</h2>
              <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                Enviamos el link de acceso a
              </p>
              <p className="text-sm font-semibold text-white mb-6">{email}</p>
              <div
                className="rounded-xl px-4 py-3 text-xs mb-5"
                style={{ background: "rgba(26,107,255,0.08)", border: "1px solid rgba(26,107,255,0.15)", color: "rgba(255,255,255,0.5)" }}
              >
                El link expira en 1 hora. Revisa también tu carpeta de spam.
              </div>
              <button
                className="text-sm font-semibold active:scale-95 transition-transform"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onClick={() => setSent(false)}
              >
                ← Usar otro email
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-3 w-full">
          {[
            { icon: "🔧", label: "OTs digitales" },
            { icon: "📱", label: "Aprobación online" },
            { icon: "💬", label: "WhatsApp" },
          ].map(f => (
            <div
              key={f.label}
              className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="text-lg mb-1">{f.icon}</p>
              <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] pb-8" style={{ color: "rgba(255,255,255,0.2)" }}>
        Solo para talleres registrados en Fixall
      </p>
    </div>
  );
}
