// Image manager for the selected APG: upload images, copy the token to drop
// them anywhere in the content, set a caption, or remove them.
import React, { useRef } from "react";
import { useApp } from "../state/store";
import { useToast } from "./Toast";
import { fileToImage, nextImageId } from "../utils/image";
import { APG } from "../state/types";

export function ImageManager({ apg }: { apg: APG }) {
  const { dispatch } = useApp();
  const notify = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    let existing = [...apg.images];
    for (const file of Array.from(files)) {
      try {
        const id = nextImageId(existing);
        const image = await fileToImage(file, id);
        existing = [...existing, image];
        dispatch({ type: "ADD_IMAGE", id: apg.id, image });
      } catch (e) {
        notify((e as Error).message, "error");
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const copyToken = (id: string) => {
    const token = `[[img:${id}]]`;
    navigator.clipboard?.writeText(token).then(
      () => notify(`Token ${token} copiado.`),
      () => notify("Copie manualmente: " + token, "error")
    );
  };

  return (
    <div className="card">
      <div className="section-title" style={{ marginTop: 0 }}>
        Imagens da APG
      </div>
      <p className="hint" style={{ marginTop: 0 }}>
        Envie imagens e insira o <code>token</code> em qualquer linha do conteúdo
        para posicioná-las. Ex.: <code>[[img:img1]]</code> ou com legenda{" "}
        <code>[[img:img1|Pulmões em corte]]</code>.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => onFiles(e.target.files)}
      />
      <button className="btn btn-accent btn-block" onClick={() => fileRef.current?.click()}>
        + Enviar imagens
      </button>

      {apg.images.length > 0 && (
        <div className="img-grid" style={{ marginTop: 12 }}>
          {apg.images.map((img) => (
            <div key={img.id} className="img-tile">
              <div
                className="thumb"
                style={{ backgroundImage: `url(${img.dataUrl})` }}
                title={`${img.width}×${img.height}px`}
              />
              <div className="meta">
                <span
                  className="tok"
                  onClick={() => copyToken(img.id)}
                  title="Clique para copiar o token"
                >
                  [[img:{img.id}]]
                </span>
                <input
                  type="text"
                  placeholder="Legenda (opcional)"
                  value={img.caption ?? ""}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_IMAGE",
                      id: apg.id,
                      imageId: img.id,
                      patch: { caption: e.target.value },
                    })
                  }
                />
                <button
                  className="btn btn-danger btn-xs btn-block"
                  style={{ marginTop: 6 }}
                  onClick={() =>
                    dispatch({ type: "REMOVE_IMAGE", id: apg.id, imageId: img.id })
                  }
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
