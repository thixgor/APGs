// Minimal toast notifications (success / error) via context.
import React, { createContext, useCallback, useContext, useState } from "react";

type Toast = { msg: string; kind: "ok" | "error" } | null;
const ToastCtx = createContext<(msg: string, kind?: "ok" | "error") => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast>(null);

  const notify = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    setToast({ msg, kind });
    window.clearTimeout((notify as any)._t);
    (notify as any)._t = window.setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={notify}>
      {children}
      {toast && <div className={`toast ${toast.kind === "error" ? "error" : ""}`}>{toast.msg}</div>}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
