import React, { useEffect, useState } from "react";
import { ToastProvider } from "./components/Toast";
import { Sidebar } from "./components/Sidebar";
import { Editor } from "./components/Editor";
import { useApp } from "./state/store";
import { BRAND } from "./state/types";

function SyncBanner() {
  const { sync } = useApp();
  const { online, error, pending, loadingImages } = sync;

  // Everything landed and nothing is loading: no banner at all.
  if (online && !error && pending === 0 && loadingImages === 0) return null;

  if (!online) {
    return (
      <div className="storage-banner">
        ⚠ Sem conexão com o servidor. Tudo o que você escrever fica guardado{" "}
        <strong>aqui no computador</strong> e sobe sozinho assim que a conexão voltar — nada
        se perde, mesmo se você fechar a aba.
        {pending > 0 && <> ({pending} pendente{pending > 1 ? "s" : ""})</>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="storage-banner">
        ⚠ Erro ao sincronizar: {error} Tentando de novo automaticamente
        {pending > 0 && <> · {pending} item(ns) ainda não salvo(s)</>}.
      </div>
    );
  }

  if (loadingImages > 0) {
    return (
      <div className="storage-banner subtle">
        ⏳ Carregando {loadingImages} imagem(ns) do acervo…
      </div>
    );
  }

  return (
    <div className="storage-banner subtle">
      💾 Salvando {pending} alteração(ões)…
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
