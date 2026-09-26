// Explicit, click-triggered notification chime for previewing
// `behavior.sound = true`. Never autoplays — only ever called from a
// button's onClick, so it always runs inside a user gesture and is
// never blocked by browser autoplay policy.
//
// Synthesized via the Web Audio API rather than a bundled sound file:
// the codebase has no existing notification sound anywhere (grepped —
// production Bot.jsx/OyaBot.jsx never play audio despite
// `behavior.sound` existing in the schema), so there was nothing to
// reuse, and this avoids adding a new binary asset for one small
// admin-only preview affordance.
export function playPreviewChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.11;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
    setTimeout(() => ctx.close(), 500);
    return true;
  } catch {
    return false;
  }
}
