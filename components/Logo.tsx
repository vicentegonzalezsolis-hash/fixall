import Image from "next/image";

interface Props {
  /** "sm" = 72px ancho · "md" = 96px · "lg" = 140px */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const WIDTHS = { sm: 72, md: 96, lg: 140 };
const HEIGHTS = { sm: 28, md: 37, lg: 54 };

export default function Logo({ size = "md", className = "" }: Props) {
  const w = WIDTHS[size];
  const h = HEIGHTS[size];

  return (
    <div
      className={className}
      style={{
        width: w,
        height: h,
        flexShrink: 0,
      }}
    >
      <Image
        src="/logo.png"
        alt="Fixall"
        width={w}
        height={h}
        style={{
          objectFit: "contain",
          display: "block",
          // Convierte cualquier color a negro (brightness 0),
          // luego invierte a blanco puro — fondo desaparece, texto queda blanco
          filter: "brightness(0) invert(1)",
        }}
        priority
      />
    </div>
  );
}
