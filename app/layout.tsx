import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fixall — Gestión de Taller",
  description: "Sistema de gestión para talleres mecánicos en Chile",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fixall",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0D0D0D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bg antialiased">
        <div className="mx-auto max-w-mobile min-h-screen relative">
          {children}
        </div>
      </body>
    </html>
  );
}
