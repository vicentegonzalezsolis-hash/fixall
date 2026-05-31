"use client";

import { useState } from "react";

function formatCLPShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

interface BarData {
  label: string;
  ingresos: number;
  ots: number;
}

interface Props {
  data: BarData[];
}

export default function GraficoBarras({ data }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const maxVal = Math.max(...data.map(d => d.ingresos), 1);
  const mesActual = data.length - 1;

  // Altura del gráfico en px
  const CHART_H = 120;
  const BAR_GAP = 8;
  const totalBars = data.length;
  // Calculamos ancho de cada barra como fracción del contenedor — usamos viewBox
  const VB_W = 320;
  const barW = (VB_W - BAR_GAP * (totalBars - 1)) / totalBars;

  return (
    <div>
      {/* SVG gráfico */}
      <svg
        viewBox={`0 0 ${VB_W} ${CHART_H + 4}`}
        width="100%"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Gradiente barras normales */}
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(26,107,255,0.55)" />
            <stop offset="100%" stopColor="rgba(26,107,255,0.1)" />
          </linearGradient>
          {/* Gradiente barra activa / mes actual */}
          <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A6BFF" />
            <stop offset="100%" stopColor="rgba(26,107,255,0.3)" />
          </linearGradient>
          {/* Gradiente barra hover */}
          <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4d8fff" />
            <stop offset="100%" stopColor="rgba(77,143,255,0.3)" />
          </linearGradient>
          <clipPath id="barClip">
            <rect x="0" y="0" width={VB_W} height={CHART_H} />
          </clipPath>
        </defs>

        {/* Líneas de guía horizontales */}
        {[0.25, 0.5, 0.75, 1].map((pct) => {
          const y = CHART_H - CHART_H * pct;
          return (
            <line
              key={pct}
              x1={0}
              y1={y}
              x2={VB_W}
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Barras */}
        <g clipPath="url(#barClip)">
          {data.map((d, i) => {
            const x = i * (barW + BAR_GAP);
            const barH = maxVal > 0 ? Math.max((d.ingresos / maxVal) * CHART_H, d.ingresos > 0 ? 4 : 0) : 0;
            const y = CHART_H - barH;
            const isActive = active === i;
            const isCurrent = i === mesActual;
            const rx = 4;

            let fill = "url(#barGrad)";
            if (isActive) fill = "url(#barGradHover)";
            else if (isCurrent) fill = "url(#barGradActive)";

            return (
              <g key={i}>
                {/* Zona interactiva (ancha) */}
                <rect
                  x={x}
                  y={0}
                  width={barW}
                  height={CHART_H}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onTouchStart={() => setActive(i)}
                  onTouchEnd={() => setActive(null)}
                />
                {/* Barra */}
                {barH > 0 && (
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={rx}
                    fill={fill}
                    style={{ transition: "fill 0.15s" }}
                    pointerEvents="none"
                  />
                )}
                {/* Sin datos */}
                {barH === 0 && (
                  <rect
                    x={x}
                    y={CHART_H - 3}
                    width={barW}
                    height={3}
                    rx={1.5}
                    fill="rgba(255,255,255,0.06)"
                    pointerEvents="none"
                  />
                )}
                {/* Tooltip valor encima de barra activa */}
                {isActive && d.ingresos > 0 && (
                  <>
                    <rect
                      x={x + barW / 2 - 24}
                      y={y - 22}
                      width={48}
                      height={16}
                      rx={4}
                      fill="rgba(26,107,255,0.9)"
                      pointerEvents="none"
                    />
                    <text
                      x={x + barW / 2}
                      y={y - 11}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="700"
                      fill="white"
                      pointerEvents="none"
                    >
                      {formatCLPShort(d.ingresos)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Etiquetas de meses */}
      <div className="flex mt-2" style={{ gap: BAR_GAP }}>
        {data.map((d, i) => {
          const isCurrent = i === mesActual;
          const isActive = active === i;
          return (
            <div
              key={i}
              className="text-center"
              style={{
                flex: 1,
                fontSize: 10,
                fontWeight: isCurrent ? 700 : 500,
                color: isActive
                  ? "#fff"
                  : isCurrent
                  ? "#1A6BFF"
                  : "rgba(255,255,255,0.3)",
                transition: "color 0.15s",
              }}
            >
              {d.label}
            </div>
          );
        })}
      </div>

      {/* Leyenda OTs / hover info */}
      <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {active !== null ? (
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">
              {data[active].label}
            </span>
            <div className="flex items-center gap-3">
              <span style={{ color: "rgba(255,255,255,0.45)" }}>
                {data[active].ots} OT{data[active].ots !== 1 ? "s" : ""}
              </span>
              <span className="font-bold" style={{ color: "#1A6BFF" }}>
                {data[active].ingresos > 0 ? formatCLPShort(data[active].ingresos) : "Sin ingresos"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <span
              className="inline-block w-2 h-2 rounded-sm"
              style={{ background: "#1A6BFF", flexShrink: 0 }}
            />
            <span>Ingresos por mes · Toca una barra para ver detalle</span>
          </div>
        )}
      </div>
    </div>
  );
}
