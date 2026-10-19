import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSnippet, timeAgo, installStatus, PLATFORM_GUIDES } from "../src/pages/chatbots/install/installUtils.js";

const NOW = new Date("2026-10-18T12:00:00Z").getTime();
const ago = (ms) => new Date(NOW - ms).toISOString();

test("buildSnippet is the one-line embed", () => {
  assert.equal(
    buildSnippet({ widgetUrl: "https://cdn.test/", chatbotId: "abc" }),
    '<script src="https://cdn.test/widget.js" data-chatbot-id="abc" async></script>'
  );
});

test("timeAgo", () => {
  assert.equal(timeAgo(ago(20 * 1000), NOW), "just now");
  assert.equal(timeAgo(ago(2 * 60 * 1000), NOW), "2 min ago");
  assert.equal(timeAgo(ago(3 * 3600 * 1000), NOW), "3 h ago");
  assert.equal(timeAgo(ago(1 * 86400 * 1000), NOW), "1 day ago");
  assert.equal(timeAgo(ago(5 * 86400 * 1000), NOW), "5 days ago");
});

test("installStatus: none, live, not recent", () => {
  assert.deepEqual(installStatus([], NOW), { state: "none", sites: [] });
  assert.deepEqual(installStatus(undefined, NOW), { state: "none", sites: [] });

  const live = installStatus(
    [
      { origin: "https://old.example.com", lastSeenAt: ago(3 * 86400 * 1000) },
      { origin: "https://shop.example.com", lastSeenAt: ago(2 * 60 * 1000) },
    ],
    NOW
  );
  assert.equal(live.state, "live");
  assert.deepEqual(
    live.sites.map((s) => [s.host, s.ago, s.recent]),
    [["shop.example.com", "2 min ago", true], ["old.example.com", "3 days ago", false]]
  );

  assert.equal(installStatus([{ origin: "https://a.test", lastSeenAt: ago(2 * 86400 * 1000) }], NOW).state, "stale");
});

test("every platform guide has steps", () => {
  const ids = PLATFORM_GUIDES.map((g) => g.id);
  assert.deepEqual(ids, ["html", "wordpress", "shopify", "wix", "webflow", "squarespace", "gtm"]);
  for (const g of PLATFORM_GUIDES) {
    assert.ok(g.label, g.id);
    assert.ok(g.steps.length >= 3, g.id);
    assert.ok(g.steps.every((s) => typeof s === "string" && s.length > 10), g.id);
  }
});
