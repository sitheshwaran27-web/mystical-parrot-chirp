import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Global error handler for "White Screen of Death" debugging
window.onerror = function (message, source, lineno, colno, error) {
    const root = document.getElementById("root");
    if (root) {
        root.innerHTML += `
      <div style="color: red; padding: 20px; border: 2px solid red; background: #fff;">
        <h1>Global Script Error</h1>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Source:</strong> ${source}:${lineno}:${colno}</p>
        <pre>${error?.stack || "No stack trace"}</pre>
      </div>
    `;
    }
};

window.onunhandledrejection = function (event) {
    const root = document.getElementById("root");
    if (root) {
        root.innerHTML += `
        <div style="color: red; padding: 20px; border: 2px solid red; background: #fff; margin-top: 20px;">
          <h1>Unhandled Promise Rejection</h1>
          <pre>${event.reason}</pre>
        </div>
      `;
    }
};

createRoot(document.getElementById("root")!).render(<App />);
