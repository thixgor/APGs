import React, { useEffect, useState } from "react";
import { ToastProvider } from "./components/Toast";
import { Sidebar } from "./components/Sidebar";
import { Editor } from "./components/Editor";
import { useApp } from "./state/store";
import { BRAND } from "./state/types";

function SyncBanner() {
  const { online, syncError } = useApp();
  if (online && !syncError) return null;
  return (
    <div className="storage-banner">
      {online ? (
        <>⚠ Um erro ocorreu ao sincronizar: {syncError}. Tentando novamente…</>
      ) : (
        <>
          ⚠ Sem conexão com o servidor. Suas edições estão sendo guardadas na tela e serão
          enviadas assim que a conexão voltar — <strong>não feche a aba</strong> até
          reconectar.
        </>
      )}
    </div>
  );
}

export function App() {
  // On phones/tablets the sidebar becomes a slide-in drawer (it is always
  // visible from 900px up, where this state is simply ignored by the CSS).
  const [navOpen, setNavOpen] = useState(false);

  // Close the drawer with Esc, like every other overlay in the app.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <ToastProvider>
      <div className={`app${navOpen ? " nav-open" : ""}`}>
        <header className="topbar">
          <button
            className="nav-toggle"
            aria-label={navOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            {navOpen ? "✕" : "☰"}
          </button>
          <div className="brand">
            <div className="mark">D</div>
            <div>
              <h1>{BRAND.name}</h1>
              <div className="sub">
                Acervo compartilhado · {BRAND.area} · {BRAND.year}
              </div>
            </div>
          </div>
          <div className="site">{BRAND.site}</div>
        </header>
        <SyncBanner />
        <div className="workspace">
          <Sidebar onNavigate={() => setNavOpen(false)} />
          <Editor />
        </div>
        <div
          className="nav-backdrop"
          role="presentation"
          onClick={() => setNavOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
