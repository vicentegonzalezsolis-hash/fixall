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
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-dim border border-primary/20 mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 16C6 10.477 10.477 6 16 6s10 4.477 10 10-4.477 10-10 10S6 21.523 6 16z" stroke="#1A6BFF" strokeWidth="2"/>
            <path d="M13 16l2 2 4-4" stroke="#1A6BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 6v2M16 24v2M6 16H4M28 16h-2" stroke="#1A6BFF" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Fixall</h1>
        <p className="text-text-secondary text-sm mt-1">Gestión de taller mecánico</p>
      </div>

      <div className="w-full card">
        {!sent ? (
          <>
            <h2 className="text-lg font-bold mb-1">Iniciar sesión</h2>
            <p className="text-text-secondary text-sm mb-6">
              Te enviaremos un link mágico a tu email
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email del taller</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="taller@ejemplo.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-danger-dim border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-primary w-full"
              >
                {loading ? "Enviando..." : "Enviar link de acceso"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-success-dim flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M8 14l4 4 8-8" stroke="#00D68F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-2">¡Revisa tu email!</h2>
            <p className="text-text-secondary text-sm">
              Enviamos un link de acceso a<br />
              <span className="text-white font-semibold">{email}</span>
            </p>
            <button
              className="btn-secondary w-full mt-6 text-sm"
              onClick={() => setSent(false)}
            >
              Intentar con otro email
            </button>
          </div>
        )}
      </div>

      <p className="text-text-muted text-xs mt-8 text-center">
        Solo para talleres registrados en Fixall
      </p>
    </div>
  );
}
