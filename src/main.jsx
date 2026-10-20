import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { animationCss } from "./config/widgetStyle.js";

if (
  localStorage.getItem("nuformly-theme") === "dark" ||
  (!localStorage.getItem("nuformly-theme") &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
}

// Chatbot preview motion — the same definition the real widget uses
// (config/widgetStyle.js), so every Studio animation tile and the live
// preview move exactly like production.
const previewMotion = document.createElement("style");
previewMotion.id = "nfp-motion";
previewMotion.textContent = animationCss("nfp");
document.head.appendChild(previewMotion);

// Feeds the cursor position to the hover spotlight on .card-fx cards.
document.addEventListener(
  "pointermove",
  (e) => {
    const card = e.target instanceof Element ? e.target.closest(".card-fx") : null;
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  },
  { passive: true }
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
