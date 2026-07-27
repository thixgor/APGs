import React from "react";
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
  return (
    <ToastProvider>
      <div className="app">
        <header className="topbar">
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
          <Sidebar />
          <Editor />
        </div>
      </div>
    </ToastProvider>
  );
}
