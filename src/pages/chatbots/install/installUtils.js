// Pure helpers for the Installation page and the public install page
// (no React, so they're unit-tested with node --test).

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** The one-line embed a website owner pastes. */
export function buildSnippet({ widgetUrl, chatbotId }) {
  const base = widgetUrl.replace(/\/+$/, "");
  return `<script src="${base}/widget.js" data-chatbot-id="${chatbotId}" async></script>`;
}

export function timeAgo(date, now = Date.now()) {
  const ms = now - new Date(date).getTime();
  if (ms < MINUTE) return "just now";
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)} min ago`;
  if (ms < DAY) return `${Math.floor(ms / HOUR)} h ago`;
  const days = Math.floor(ms / DAY);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

/**
 * state: "none" — never seen; "live" — seen on some website in the last
 * 24 h; "stale" — only seen longer ago. Sites are most recent first.
 */
export function installStatus(installations, now = Date.now()) {
  const sites = [...(installations || [])]
    .sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))
    .map((i) => {
      let host = i.origin;
      try {
        host = new URL(i.origin).host;
      } catch {
        // keep the raw value
      }
      return {
        origin: i.origin,
        host,
        lastSeenAt: i.lastSeenAt,
        ago: timeAgo(i.lastSeenAt, now),
        recent: now - new Date(i.lastSeenAt).getTime() < DAY,
      };
    });
  if (sites.length === 0) return { state: "none", sites: [] };
  return { state: sites.some((s) => s.recent) ? "live" : "stale", sites };
}

export const PLATFORM_GUIDES = [
  {
    id: "html",
    label: "HTML",
    steps: [
      "Open the HTML of your site — the shared footer or layout template if you have one, otherwise every page.",
      "Paste the line just before the closing </body> tag.",
      "Save and publish, then open your site: the chat button appears in the bottom corner.",
    ],
  },
  {
    id: "wordpress",
    label: "WordPress",
    steps: [
      "In WordPress go to Plugins → Add New, search for “WPCode” and install and activate it.",
      "Go to Code Snippets → Header & Footer.",
      "Paste the line into the “Footer” box and click Save Changes.",
      "Open your site in a new tab: the chat button appears in the bottom corner.",
    ],
  },
  {
    id: "shopify",
    label: "Shopify",
    steps: [
      "In your Shopify admin go to Online Store → Themes.",
      "Next to your current theme click “…” → Edit code.",
      "Open layout/theme.liquid and paste the line just before the closing </body> tag.",
      "Click Save, then open your store: the chat button appears in the bottom corner.",
    ],
  },
  {
    id: "wix",
    label: "Wix",
    steps: [
      "In your Wix dashboard go to Settings → Custom Code (under Advanced). This needs a Premium plan with a connected domain.",
      "Click “+ Add Custom Code” and paste the line.",
      "Choose “All pages”, load code “Once”, and place it in “Body - end”, then click Apply.",
      "Publish your site and open it: the chat button appears in the bottom corner.",
    ],
  },
  {
    id: "webflow",
    label: "Webflow",
    steps: [
      "Open your project's Site settings → Custom code.",
      "Paste the line into “Footer code” (before the </body> tag) and save.",
      "Publish the site, then open it: the chat button appears in the bottom corner.",
    ],
  },
  {
    id: "squarespace",
    label: "Squarespace",
    steps: [
      "Go to Website → Pages → Custom code → Code Injection (Settings → Advanced → Code Injection on older versions). This needs a Business or Commerce plan.",
      "Paste the line into the “Footer” box.",
      "Save, then open your site: the chat button appears in the bottom corner.",
    ],
  },
  {
    id: "gtm",
    label: "Google Tag Manager",
    steps: [
      "In Google Tag Manager create a new Tag and choose the “Custom HTML” tag type.",
      "Paste the line into the HTML box.",
      "Set the trigger to “All Pages” and save the tag.",
      "Click Submit to publish the container, then open your site: the chat button appears in the bottom corner.",
    ],
  },
];
