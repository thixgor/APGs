import React from "react";
import ReactDOM from "react-dom/client";
import { AppProvider } from "./state/store";
import { App } from "./App";
import "./styles/app.css";
import "./styles/visual-editor.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
