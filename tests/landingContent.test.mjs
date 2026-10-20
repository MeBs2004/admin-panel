import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const plansFile = join(here, "../../backend/config/plans.js");

// The landing page makes promises; these keep them true.
test("landing plans match backend/config/plans.js", { skip: !existsSync(plansFile) && "needs ../backend" }, async () => {
  const { PLANS: BE } = await import(pathToFileURL(plansFile).href);
  const { PLANS, PLAN_ROWS } = await import("../src/pages/landing/content.js");
  assert.deepEqual(PLANS.map((p) => p.id), Object.keys(BE));
  for (const p of PLANS) {
    assert.equal(p.price, BE[p.id].monthlyPrice, `${p.id} price`);
    for (const [key] of PLAN_ROWS) assert.equal(p.limits[key], BE[p.id].limits[key], `${p.id}.${key}`);
  }
  // "Every plan has every feature" — only the not-yet-built custom_branding is off.
  for (const plan of Object.values(BE)) {
    for (const f of ["knowledge_base", "human_handoff", "bot_builder", "developer_api", "developer_webhooks", "advanced_analytics", "advanced_channels"]) {
      assert.equal(plan.features[f], true, `${plan.id} lacks ${f}`);
    }
  }
});

test("landing templates are the real sector templates", async () => {
  const { TEMPLATES } = await import("../src/pages/landing/content.js");
  const { SECTOR_TEMPLATES } = await import("../src/config/sectorTemplates.js");
  assert.deepEqual(TEMPLATES.map((t) => t.key), SECTOR_TEMPLATES.map((t) => t.value));
});

test("option counts on the page come from the real option lists", async () => {
  const { COUNTS } = await import("../src/pages/landing/content.js");
  const { CONFIG_OPTIONS } = await import("../src/config/chatbotConfigDefaults.js");
  assert.equal(COUNTS.autoOpenAnimations, CONFIG_OPTIONS["behavior.autoOpenAnimation"].length - 1);
  assert.equal(COUNTS.launcherMotions, CONFIG_OPTIONS["launcher.animation"].length - 1);
  assert.ok(COUNTS.autoOpenAnimations >= 10);
});

test("the demo bot answers each of its own suggestions", async () => {
  const { DEMO_CONFIG, demoReply } = await import("../src/pages/landing/demoBot.js");
  const fallback = demoReply("zzz");
  assert.equal(DEMO_CONFIG.suggestions.length, 4);
  for (const s of DEMO_CONFIG.suggestions) assert.notEqual(demoReply(s), fallback, s);
  assert.match(demoReply("how much does it cost?"), /Free plan/);
  assert.match(demoReply("Can I use WhatsApp?"), /WhatsApp/);
});
