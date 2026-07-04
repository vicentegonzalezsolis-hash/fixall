"use client";

import Image from "next/image";
import { useState } from "react";
import { FotoOT } from "@/types/database";

export default function FotoGrid({ fotos, onDelete }: { fotos: FotoOT[]; onDelete?: (id: string) => void }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {fotos.map((f) => (
          <div key={f.id} className="relative rounded-xl overflow-hidden aspect-square bg-surface-2 group">
            <Image
              src={f.url}
              alt={f.descripcion || "foto"}
              fill
              className="object-cover cursor-pointer"
              onClick={() => setLightbox(f.url)}
            />
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(f.id); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-bg/80 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative w-full max-w-mobile aspect-square">
            <Image src={lightbox} alt="" fill className="object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </>
  );
}
