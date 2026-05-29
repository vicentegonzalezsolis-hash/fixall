import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-extrabold text-primary mb-4">404</p>
      <h1 className="text-xl font-bold mb-2">Página no encontrada</h1>
      <p className="text-text-secondary text-sm mb-8">El presupuesto o página que buscas no existe.</p>
      <Link href="/dashboard" className="btn-primary px-8">Ir al dashboard</Link>
    </div>
  );
}
