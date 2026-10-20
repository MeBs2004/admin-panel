// One place that flips light/dark, so the header button and the command
// palette stay in sync (the header listens for this event).
export function toggleTheme() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  try {
    localStorage.setItem("nuformly-theme", next ? "dark" : "light");
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event("nuformly-theme"));
  return next;
}
