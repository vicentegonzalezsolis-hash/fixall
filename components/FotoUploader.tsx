"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TipoFoto } from "@/types/database";

interface Props {
  otId: string;
  tipo: TipoFoto;
  count: number;
  onUploaded: () => void;
}

export default function FotoUploader({ otId, tipo, count, onUploaded }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  const max = 4;

  async function handleFiles(files: FileList) {
    if (count >= max) return;
    setUploading(true);
    for (const file of Array.from(files).slice(0, max - count)) {
      const ext = file.name.split(".").pop();
      const path = `${otId}/${tipo}/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("ot-fotos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from("ot-fotos")
          .getPublicUrl(data.path);

        await supabase.from("fotos_ot").insert({
          ot_id: otId,
          tipo,
          url: publicUrl,
        });
      }
    }
    setUploading(false);
    onUploaded();
  }

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={count >= max || uploading}
        className="w-full border-2 border-dashed border-border rounded-xl py-4 flex flex-col items-center gap-2 text-text-muted hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-40"
      >
        {uploading ? (
          <span className="text-sm">Subiendo...</span>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v10M7 9l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-medium">
              {count >= max ? "Máximo 4 fotos" : `Agregar foto (${count}/${max})`}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
