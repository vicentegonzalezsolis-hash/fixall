"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Check } from "lucide-react";

const FEATURES = [
  "Órdenes de trabajo digitales",
  "Presupuestos al cliente en 1 click",
  "Control de inventario en tiempo real",
  "Reportes de ingresos mensuales",
];

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
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "#0D0D0D" }}>
      <div
        className="w-full md:max-w-[860px] flex flex-col-reverse md:flex-row overflow-hidden"
        style={{ borderRadius: 20, border: "1px solid #1a2a3a" }}
      >
        {/* ── COLUMNA IZQUIERDA (info) — 45% ── */}
        <div
          className="w-full md:w-[45%] p-8 md:p-9 flex flex-col justify-between gap-8"
          style={{ background: "#1E466B" }}
        >
          <div>
            <p style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>
              <span style={{ color: "#FAFAFA" }}>Fix</span>
              <span style={{ color: "#67BAF4" }}>all</span>
            </p>

            <p className="mt-6" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
              <span style={{ color: "#FAFAFA" }}>Tu taller,</span>
              <br />
              <span style={{ color: "#67BAF4" }}>bajo control.</span>
            </p>

            <ul className="mt-7 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span
                    className="shrink-0"
                    style={{ width: 6, height: 6, borderRadius: 9999, background: "#67BAF4" }}
                  />
                  <span style={{ color: "rgba(250,250,250,0.75)", fontSize: 13 }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <p
            className="uppercase tracking-widest"
            style={{ color: "rgba(103,186,244,0.5)", fontSize: 11 }}
          >
            Para talleres mecánicos
          </p>
        </div>

        {/* ── COLUMNA DERECHA (formulario) — 55% ── */}
        <div className="w-full md:w-[55%] p-8 md:p-10 flex flex-col justify-center" style={{ background: "#0D0D0D" }}>
          {!sent ? (
            <>
              <h1 style={{ color: "#FAFAFA", fontSize: 22, fontWeight: 800 }}>Iniciar sesión</h1>
              <p className="mt-1.5 mb-6" style={{ color: "#555555", fontSize: 13 }}>
                Te enviamos un link de acceso a tu email
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block uppercase tracking-widest mb-2"
                    style={{ color: "#888888", fontSize: 11, fontWeight: 600 }}
                  >
                    Email del taller
                  </label>
                  <div
                    className="relative overflow-hidden"
                    style={{ background: "#111827", border: "1px solid #1a2a3a", borderRadius: 12 }}
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
                  className="w-full py-3.5 active:scale-[0.98] transition-transform disabled:opacity-50"
                  style={{
                    background: "#1E466B",
                    border: "1.5px solid #67BAF4",
                    borderRadius: 12,
                    color: "#67BAF4",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
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

              <p className="text-center mt-4" style={{ color: "#555555", fontSize: 12 }}>
                Sin contraseñas. Acceso instantáneo por email.
              </p>
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
      </div>
    </div>
  );
}
