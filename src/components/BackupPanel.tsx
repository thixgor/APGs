// Backup / sharing:
//  - export every APG to a portable .json file, or import one (e.g. from a colleague);
//  - automatic backup to a folder on the PC (File System Access API): the user
//    picks a folder once and the app keeps a rolling backup file + daily snapshot
//    there whenever the data changes.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../state/store";
import { useToast } from "./Toast";
import { exportApgsFile, parseBackup } from "../utils/backup";
import { ImportDialog } from "./ImportDialog";
import { APG } from "../state/types";
import {
  clearBackupDir,
  dirName,
  ensurePermission,
  fsSupported,
  getBackupDir,
  pickBackupDir,
  writeBackup,
} from "../utils/autobackup";

type AutoStatus = "off" | "active" | "needs-permission";

export function BackupPanel() {
  const { state, dispatch } = useApp();
  const notify = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- manual export / import ----
  const onExport = () => {
    if (state.apgs.length === 0) {
      notify("Nenhuma APG para exportar.", "error");
      return;
    }
    exportApgsFile(state.apgs, state.theme);
    notify(`${state.apgs.length} APG(s) exportada(s) para arquivo.`);
  };

  const [importing, setImporting] = useState<unknown[] | null>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const { apgs } = parseBackup(await file.text());
      if (apgs.length === 0) {
        notify("O arquivo não contém APGs.", "error");
        return;
      }
      // Conflict = same Período + Número as an existing APG.
      const byKey = new Set(state.apgs.map((a) => `${a.periodo}|${a.numero}`));
      const hasConflict = apgs.some((r: any) => {
        const p = Math.max(1, Math.round(Number(r?.periodo)) || 1);
        const n = Math.max(1, Math.round(Number(r?.numero)) || 1);
        return byKey.has(`${p}|${n}`);
      });
      if (hasConflict) {
        setImporting(apgs); // open the resolution dialog
      } else {
        dispatch({ type: "IMPORT_APGS", apgs, replace: false });
        notify(`${apgs.length} APG(s) importada(s).`);
      }
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const applyImport = (finalApgs: APG[], summary: string) => {
    dispatch({ type: "SET_APGS", apgs: finalApgs });
    setImporting(null);
    notify(`Importação concluída: ${summary}.`);
  };

  // ---- automatic folder backup ----
  const supported = fsSupported();
  const [status, setStatus] = useState<AutoStatus>("off");
  const [folder, setFolder] = useState<string>("");
  const [lastAt, setLastAt] = useState<string>("");
  const handleRef = useRef<any>(null);
  const saveTimer = useRef<number>();

  // Restore a previously chosen folder on mount.
  useEffect(() => {
    if (!supported) return;
    (async () => {
      const h = await getBackupDir();
      if (!h) return;
      handleRef.current = h;
      setFolder(dirName(h));
      setStatus((await ensurePermission(h, false)) ? "active" : "needs-permission");
    })();
  }, [supported]);

  const doBackup = useCallback(async () => {
    const h = handleRef.current;
    if (!h) return;
    try {
      if (!(await ensurePermission(h, false))) {
        setStatus("needs-permission");
        return;
      }
      await writeBackup(h, state.apgs, state.theme);
      setLastAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      setStatus("active");
    } catch {
      setStatus("needs-permission");
    }
  }, [state.apgs, state.theme]);

  // Auto-write (debounced) whenever the data changes and a folder is active.
  useEffect(() => {
    if (status !== "active") return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(doBackup, 3000);
    return () => window.clearTimeout(saveTimer.current);
  }, [state.apgs, state.theme, status, doBackup]);

  const chooseFolder = async () => {
    try {
      const h = await pickBackupDir();
      handleRef.current = h;
      setFolder(dirName(h));
      setStatus("active");
      await writeBackup(h, state.apgs, state.theme);
      setLastAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      notify(`Backup automático ativado na pasta "${dirName(h)}".`);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") notify("Não foi possível escolher a pasta.", "error");
    }
  };

  const reactivate = async () => {
    const h = handleRef.current;
    if (!h) return;
    if (await ensurePermission(h, true)) {
      setStatus("active");
      await doBackup();
      notify("Backup automático reativado.");
    } else {
      notify("Permissão negada para a pasta.", "error");
    }
  };

  const disable = async () => {
    await clearBackupDir();
    handleRef.current = null;
    setStatus("off");
    setFolder("");
    setLastAt("");
  };

  return (
    <>
      <div className="section-title">Backup / Compartilhar</div>
      <div className="card">
        <div className="export-actions">
          <button className="btn btn-ghost btn-block" onClick={onExport}>
            ⬆ Exportar APGs (arquivo)
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => fileRef.current?.click()}>
            ⬇ Importar APGs (arquivo)
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        {/* automatic folder backup */}
        {supported ? (
          <div className="autobackup">
            {status === "off" && (
              <>
                <button className="btn btn-accent btn-block" onClick={chooseFolder}>
                  💾 Ativar backup automático (pasta no PC)
                </button>
                <p className="hint" style={{ marginTop: 6 }}>
                  Escolha uma pasta e o app salva tudo lá sozinho, sempre que você editar.
                </p>
              </>
            )}
            {status === "active" && (
              <div className="autobackup-on">
                <div className="ab-line">
                  <span className="ab-dot ok" /> Backup automático ativo
                </div>
                <div className="ab-sub">
                  Pasta: <strong>{folder}</strong>
                  {lastAt && <> · último: {lastAt}</>}
                </div>
                <button className="btn btn-ghost btn-xs" onClick={disable}>
                  Desativar
                </button>
              </div>
            )}
            {status === "needs-permission" && (
              <div className="autobackup-on">
                <div className="ab-line">
                  <span className="ab-dot warn" /> Backup pausado — reautorize a pasta
                </div>
                <div className="ab-sub">
                  Pasta: <strong>{folder}</strong>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-accent btn-xs" onClick={reactivate}>
                    Reativar
                  </button>
                  <button className="btn btn-ghost btn-xs" onClick={disable}>
                    Desativar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="hint" style={{ marginTop: 8 }}>
            Dica: use o Chrome ou o Edge para ativar o <strong>backup automático em pasta</strong>{" "}
            do seu PC.
          </p>
        )}

        <p className="hint" style={{ marginTop: 8 }}>
          Suas APGs ficam guardadas no banco de dados do navegador (IndexedDB) — robusto e sem
          o limite que apagava dados. Ainda assim, mantenha um backup em pasta ou arquivo.
        </p>
      </div>

      {importing && (
        <ImportDialog
          incoming={importing}
          existing={state.apgs}
          onCancel={() => setImporting(null)}
          onApply={applyImport}
        />
      )}
    </>
  );
}
