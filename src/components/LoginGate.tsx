// Shared-password gate. Shown before the app loads any data. On success the
// password is stored (in memory + sessionStorage) and the provider proceeds to
// load the acervo from the server.
import React, { useState } from "react";
import { login } from "../state/api";
import { BRAND } from "../state/types";

export function LoginGate({ onAuthed }: { onAuthed: () => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const ok = await login(pw);
      if (ok) onAuthed();
      else setErr("Senha incorreta.");
    } catch (e) {
      setErr((e as Error).message || "Não foi possível conectar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-gate">
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark">D</div>
        <h1>{BRAND.name}</h1>
        <p className="login-sub">
          Acervo compartilhado de APGs · {BRAND.area}
        </p>
        <label className="field">
          <span>Senha de acesso</span>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Digite a senha compartilhada"
          />
        </label>
        {err && <div className="login-err">{err}</div>}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy || !pw}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
