import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const backend = join(here, "../../backend/config");
const frontendStyle = join(here, "../../frontend/src/components/NuformlyWidget/widgetStyle.js");
const haveBackend = existsSync(join(backend, "chatbotConfig.js"));
const url = (p) => pathToFileURL(p).href;

// The admin panel, backend and widget are separate deployables that
// share one config shape by copy. These tests fail the moment a copy drifts.
test("admin defaults and starter match the backend's", { skip: !haveBackend && "needs ../backend" }, async () => {
  const be = await import(url(join(backend, "chatbotConfig.js")));
  const beStarter = await import(url(join(backend, "chatbotStarter.js")));
  const admin = await import("../src/config/chatbotConfigDefaults.js");
  const adminStarter = await import("../src/config/chatbotStarter.js");
  assert.deepEqual(admin.DEFAULT_CHATBOT_CONFIG, be.DEFAULT_CHATBOT_CONFIG, "DEFAULT_CHATBOT_CONFIG drifted");
  assert.deepEqual(adminStarter.STARTER_CHATBOT_CONFIG, beStarter.STARTER_CHATBOT_CONFIG, "STARTER_CHATBOT_CONFIG drifted");
});

test("every option list and size range matches the backend", { skip: !haveBackend && "needs ../backend" }, async () => {
  const be = await import(url(join(backend, "chatbotConfig.js")));
  const { CONFIG_OPTIONS } = await import("../src/config/chatbotConfigDefaults.js");
  const { SIZE_RANGES } = await import("../src/config/widgetStyle.js");

  const backendLists = {
    "launcher.shape": be.LAUNCHER_SHAPES,
    "launcher.icon": be.LAUNCHER_ICONS,
    "launcher.animation": be.LAUNCHER_ANIMATIONS,
    "launcher.entrance": be.LAUNCHER_ENTRANCES,
    "launcher.hoverEffect": be.LAUNCHER_HOVERS,
    "launcher.bubbleAnimation": be.BUBBLE_ANIMATIONS,
    "launcher.bubbleEffect": be.BUBBLE_EFFECTS,
    "launcher.bubbleOrder": be.BUBBLE_ORDERS,
    "launcher.shadow": be.LAUNCHER_SHADOWS,
    "chatWindow.bubbleStyle": be.BUBBLE_STYLES,
    "chatWindow.messageAnimation": be.MESSAGE_ANIMATIONS,
    "chatWindow.windowAnimation": be.WINDOW_ANIMATIONS,
    "chatWindow.typingStyle": be.TYPING_STYLES,
    "chatWindow.headerAnimation": be.HEADER_ANIMATIONS,
    "chatWindow.avatarAnimation": be.AVATAR_ANIMATIONS,
    "chatWindow.avatarShape": be.AVATAR_SHAPES,
    "chatWindow.statusStyle": be.STATUS_STYLES,
    "chatWindow.sendAnimation": be.SEND_ANIMATIONS,
    "chatWindow.sendButtonShape": be.SEND_SHAPES,
    "chatWindow.listenPlacement": be.LISTEN_PLACEMENTS,
    "chatWindow.attachIcon": be.ATTACH_ICONS,
    "chatWindow.suggestionAnimation": be.SUGGESTION_ANIMATIONS,
    "chatWindow.shadow": be.SHADOWS,
    "chatWindow.chatBackground": be.CHAT_BACKGROUNDS,
    "chatWindow.suggestionStyle": be.SUGGESTION_STYLES,
    "behavior.autoOpenAnimation": be.AUTO_OPEN_ANIMATIONS,
    "appearance.font": be.FONTS,
    "appearance.fontSize": be.FONT_SIZES,
  };
  for (const [path, list] of Object.entries(backendLists)) {
    assert.deepEqual(CONFIG_OPTIONS[path], list, `${path} options drifted`);
  }
  const flat = Object.fromEntries(Object.entries(be.SIZE_FIELDS).flatMap(([section, f]) => Object.entries(f).map(([k, r]) => [`${section}.${k}`, r])));
  assert.deepEqual(SIZE_RANGES, flat, "size ranges drifted");
});

test("shared files are byte-identical across repos", { skip: !haveBackend && "needs ../backend" }, () => {
  const same = (a, b) => readFileSync(a, "utf8") === readFileSync(b, "utf8");
  assert.ok(same(join(here, "../src/config/starterAssets.js"), join(backend, "starterAssets.js")), "starterAssets.js drifted");
  assert.ok(existsSync(frontendStyle), "widget copy of widgetStyle.js is missing");
  assert.ok(same(join(here, "../src/config/widgetStyle.js"), frontendStyle), "widgetStyle.js: admin and widget copies drifted");
  // the sign-up / login rules the page checks are the ones the server enforces
  assert.ok(same(join(here, "../src/config/accountRules.js"), join(backend, "../utils/accountRules.js")), "accountRules.js: admin and backend copies drifted");
});
