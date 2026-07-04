import Link from "next/link";

export default function AppHeader({ tallerNombre }: { tallerNombre: string }) {
  return (
    <div className="px-4 pt-12 pb-3">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
          <span style={{ color: "#FAFAFA" }}>Fix</span>
          <span style={{ color: "#67BAF4" }}>all</span>
        </p>
        <Link
          href="/perfil"
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
          style={{
            background: "#111827",
            border: "2px solid #67BAF4",
            color: "#67BAF4",
          }}
        >
          {tallerNombre?.[0]?.toUpperCase() ?? "?"}
        </Link>
      </div>
      <p className="text-sm font-bold mt-2" style={{ color: "#FAFAFA" }}>{tallerNombre}</p>
    </div>
  );
}
