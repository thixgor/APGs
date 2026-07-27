import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite configuration for the DomineAqui APG PDF generator.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    // ALWAYS use this exact port. Without strictPort, a busy 5173 makes Vite
    // fall back to 5174/5175 — a different origin — and IndexedDB is per-origin,
    // so the saved APGs would appear to "reset" on every restart. Failing loudly
    // (asking to free the port) keeps the origin — and your data — stable.
    strictPort: true,
    open: false,
  },
});
