import { test } from "node:test";
import assert from "node:assert/strict";
import { filterItems } from "../src/utils/paletteSearch.js";
import { trendDelta, weekdayRows } from "../src/utils/chartData.js";

const items = [
  { id: "1", label: "Visitors", group: "Workspace" },
  { id: "2", label: "Conversations", group: "Workspace" },
  { id: "3", label: "Billing History", group: "Billing" },
  { id: "4", label: "Toggle dark mode", group: "Actions", keywords: "theme light appearance" },
  { id: "5", label: "All Chatbots", group: "Chatbots" },
];

test("palette: empty query lists everything in order", () => {
  assert.deepEqual(filterItems(items, "").map((i) => i.id), ["1", "2", "3", "4", "5"]);
  assert.deepEqual(filterItems(items, "   ").length, 5);
});

test("palette: every word must match, across label, group and keywords", () => {
  assert.deepEqual(filterItems(items, "vis").map((i) => i.id), ["1"]);
  assert.deepEqual(filterItems(items, "billing history").map((i) => i.id), ["3"]);
  assert.deepEqual(filterItems(items, "theme").map((i) => i.id), ["4"], "keywords are searchable");
  assert.deepEqual(filterItems(items, "chatbots all").map((i) => i.id), ["5"], "word order doesn't matter");
  assert.deepEqual(filterItems(items, "zzz"), []);
});

test("palette: word-start matches outrank mid-word matches", () => {
  const list = [
    { id: "mid", label: "Conversations", group: "x" }, // "ver" appears mid-word
    { id: "start", label: "Version history", group: "x" }, // "ver" starts a word
  ];
  assert.equal(filterItems(list, "ver")[0].id, "start");
});

test("trendDelta: later half vs earlier half, null when it can't be said", () => {
  assert.equal(trendDelta([10, 10, 20, 20]), 100);
  assert.equal(trendDelta([20, 20, 10, 10]), -50);
  assert.equal(trendDelta([5, 5, 5, 5]), 0);
  assert.equal(trendDelta([0, 0, 5, 5]), null, "earlier half is zero");
  assert.equal(trendDelta([1, 2, 3]), null, "too short");
  assert.equal(trendDelta(null), null);
  // 14 days: last 7 vs first 7
  const days = [...Array(7).fill(10), ...Array(7).fill(15)];
  assert.equal(trendDelta(days), 50);
});

test("weekdayRows: totals per weekday, Monday first", () => {
  // 2026-10-19 is a Monday, 2026-10-25 a Sunday
  const rows = weekdayRows(
    [{ _id: "2026-10-19", count: 4 }, { _id: "2026-10-26", count: 6 }, { _id: "2026-10-25", count: 2 }],
    [{ _id: "2026-10-19", count: 10 }],
  );
  assert.deepEqual(rows.map((r) => r.label), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  assert.equal(rows[0].visitors, 10, "two Mondays added");
  assert.equal(rows[0].messages, 10);
  assert.equal(rows[6].visitors, 2);
  assert.equal(rows[3].visitors, 0);
  assert.deepEqual(weekdayRows().map((r) => r.visitors), [0, 0, 0, 0, 0, 0, 0]);
  assert.equal(weekdayRows([{ _id: "not-a-date", count: 9 }]).reduce((n, r) => n + r.visitors, 0), 0, "bad dates ignored");
});
