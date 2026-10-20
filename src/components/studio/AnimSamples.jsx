import { animClass, messageAnimClass } from "../../config/widgetStyle.js";

// Tiny live samples for the animation option tiles. Each factory returns
// (tick) => node; the tile bumps `tick` on hover so entrance-style
// samples replay. They use the exact classes the preview and the real
// widget use (config/widgetStyle.js), so a tile shows the true motion.

const GRAD = "bg-gradient-to-br from-emerald-400 to-indigo-500";
const ACCENT = { "--nf-c": "#10b981" };

export const pretty = (v) => (v === "none" ? "None" : v.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "));

/** Build [{ value, label, visual }] from a value list and a sample factory. */
export const withSamples = (values, factory, labels = {}) =>
  values.map((v) => ({ value: v, label: labels[v] || pretty(v), visual: factory(v) }));

export const idleSample = (name) => () => <span className={`block h-6 w-6 rounded-full ${GRAD} ${animClass("nfp", "anim", name)}`} style={ACCENT} />;

export const entranceSample = (name) => (tick) => <span key={tick} className={`block h-6 w-6 rounded-full ${GRAD} ${animClass("nfp", "in", name)}`} />;

export const hoverSample = (name) => () => (
  <span className={`nfp-hover ${animClass("nfp", "hover", name)} flex h-8 w-10 cursor-pointer items-center justify-center`} style={ACCENT}>
    <span className={`nfp-icon block h-6 w-6 rounded-full ${GRAD}`} />
  </span>
);

export const windowSample = (name) => (tick) => (
  <span key={tick} className={`block h-8 w-10 overflow-hidden rounded-md border border-black/10 bg-white ${animClass("nfp", "win", name)}`}>
    <span className={`block h-2.5 ${GRAD}`} />
    <span className="mt-1 block h-1.5 w-6 rounded-full bg-gray-200" />
    <span className="ml-auto mr-1 mt-0.5 block h-1.5 w-4 rounded-full bg-emerald-300" />
  </span>
);

export const messageSample = (name) => (tick) => (
  <span key={tick} className="flex w-12 flex-col gap-1">
    <span className={`block h-2.5 w-8 rounded-full bg-gray-300 dark:bg-white/25 ${messageAnimClass("nfp", name, false)}`} />
    <span className={`ml-auto block h-2.5 w-7 rounded-full bg-emerald-500 ${messageAnimClass("nfp", name, true)}`} style={{ animationDelay: "120ms" }} />
  </span>
);

export const bubbleSample = (name) => (tick) => (
  <span key={tick} className={`block h-5 w-10 rounded-lg border border-gray-200 bg-white shadow-sm ${animClass("nfp", "bubble", name)}`} />
);

export const suggestionSample = (name) => (tick) => (
  <span key={tick} className="flex gap-1">
    {[0, 1].map((i) => (
      <span key={i} className={`block h-3.5 w-5 rounded-full border border-emerald-500 ${animClass("nfp", "sugg", name)}`} style={{ animationDelay: `${i * 90}ms` }} />
    ))}
  </span>
);

export const typingSample = (name) => () => (
  <span className={`nfp-typing nfp-typing-${name} rounded-full bg-gray-100 px-2.5 py-1.5 dark:bg-white/10`} style={{ "--nf-dot": "#10b981" }}>
    <i />
    <i />
    <i />
  </span>
);

export const headerSample = (name) => () => (
  <span
    className={`block h-5 w-12 rounded-md ${animClass("nfp", "head", name)}`}
    style={{ background: "linear-gradient(120deg,#0D5537,#34d399,#0D5537)", backgroundSize: name === "flow" ? "300% 300%" : "auto" }}
  />
);

export const avatarSample = (name) => () => <span className={`block h-6 w-6 rounded-full ${GRAD} ${animClass("nfp", "avatar", name)}`} />;

export const sendSample = (name) => () => (
  <span
    className={`nfp-send ${animClass("nfp", "send", name)} flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-emerald-500 text-white`}
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  </span>
);
