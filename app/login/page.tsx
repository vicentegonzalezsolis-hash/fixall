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
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(26,107,255,0.16) 0%, transparent 68%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[220px] h-[220px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,214,143,0.07) 0%, transparent 70%)" }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 relative z-10">

        {/* ── LOGO DE MARCA ── */}
        <div className="mb-10 flex flex-col items-center gap-5">
          {/* Wordmark */}
          <div className="flex items-baseline">
            <span
              className="text-5xl font-extrabold tracking-tight leading-none"
              style={{ color: "#fff", letterSpacing: "-0.03em" }}
            >
              Fix
            </span>
            <span
              className="text-5xl font-extrabold tracking-tight leading-none"
              style={{ color: "#1A6BFF", letterSpacing: "-0.03em" }}
            >
              all
            </span>
          </div>

          {/* Tagline con divider */}
          <div className="flex items-center gap-3">
            <div className="h-px w-10" style={{ background: "rgba(255,255,255,0.1)" }} />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Gestión de talleres
            </p>
            <div className="h-px w-10" style={{ background: "rgba(255,255,255,0.1)" }} />
          </div>
        </div>

        {/* ── CARD ── */}
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
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                Te enviamos un link de acceso instantáneo a tu email
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-xs font-semibold mb-2 uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    Email del taller
                  </label>
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <rect x="1" y="3" width="13" height="9" rx="2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"/>
                        <path d="M1 5.5l6.5 4 6.5-4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"/>
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
                    style={{
                      background: "rgba(255,71,87,0.08)",
                      border: "1px solid rgba(255,71,87,0.2)",
                      color: "#FF4757",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-50"
                  style={{
                    background:
                      !email || loading
                        ? "rgba(26,107,255,0.35)"
                        : "linear-gradient(135deg, #1A6BFF 0%, #0052e0 100%)",
                    boxShadow: email && !loading ? "0 8px 24px rgba(26,107,255,0.3)" : "none",
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
                style={{ background: "rgba(0,214,143,0.08)", border: "1px solid rgba(0,214,143,0.2)" }}
              >
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path
                    d="M7 15l5 5 11-10"
                    stroke="#00D68F"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Revisa tu email</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Enviamos el link de acceso a
              </p>
              <p className="text-sm font-semibold text-white mt-0.5 mb-5">{email}</p>
              <div
                className="rounded-xl px-4 py-3 text-xs text-left mb-5"
                style={{
                  background: "rgba(26,107,255,0.06)",
                  border: "1px solid rgba(26,107,255,0.12)",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                El link expira en 1 hora · Revisa también tu carpeta de spam
              </div>
              <button
                className="text-sm font-medium active:scale-95 transition-transform"
                style={{ color: "rgba(255,255,255,0.35)" }}
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
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p className="text-lg mb-1">{f.icon}</p>
              <p
                className="text-[10px] font-semibold leading-tight"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {f.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] pb-8 relative z-10" style={{ color: "rgba(255,255,255,0.18)" }}>
        Solo para talleres registrados en Fixall
      </p>
    </div>
  );
}
