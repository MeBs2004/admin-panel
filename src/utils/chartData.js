/**
 * The analytics API only returns days that actually have data
 * (sparse). Dense-fill the missing days with 0 so the chart draws
 * a continuous, honest line instead of connecting distant points.
 */
export function fillDailySeries(series, since, days) {
  const byDate = Object.fromEntries(series.map((p) => [p._id, p.count]));
  const start = new Date(since);
  const result = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: byDate[key] || 0,
    });
  }

  return result;
}

/**
 * Merge several sparse daily series into one dense row-per-day array
 * for multi-series charts: mergeDailySeries({ visitors: [...], messages: [...] }, since, days)
 * -> [{ label, visitors, messages }, ...]
 */
export function mergeDailySeries(seriesByKey, since, days) {
  const keys = Object.keys(seriesByKey);
  const dense = keys.map((k) => fillDailySeries(seriesByKey[k] || [], since, days));
  return dense[0]?.map((row, i) => {
    const out = { label: row.label };
    keys.forEach((k, ki) => {
      out[k] = dense[ki][i].value;
    });
    return out;
  }) || [];
}

/** AI-vs-human rows ({_id, ai, human}) -> dense [{ label, ai, human }] */
export function fillAiVsHuman(series, since, days) {
  const byDate = Object.fromEntries((series || []).map((r) => [r._id, r]));
  const start = new Date(since);
  const rows = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const row = byDate[d.toISOString().slice(0, 10)] || { ai: 0, human: 0 };
    rows.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      ai: row.ai || 0,
      human: row.human || 0,
    });
  }
  return rows;
}

/** Count items by a key -> [{ name, value }] */
export function countBy(items, getKey) {
  const map = new Map();
  for (const it of items || []) {
    const k = getKey(it);
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

/**
 * Change between the first and second half of a series, as a percentage:
 * +12 means the later half is 12% higher than the earlier half. null when
 * there's nothing to compare (too short, or the earlier half was zero).
 */
export function trendDelta(values) {
  if (!values || values.length < 4) return null;
  const mid = Math.floor(values.length / 2);
  const earlier = values.slice(0, mid).reduce((a, b) => a + b, 0);
  const later = values.slice(values.length - mid).reduce((a, b) => a + b, 0);
  if (earlier === 0) return null;
  return Math.round(((later - earlier) / earlier) * 100);
}

/**
 * Totals per weekday (Mon–Sun) from the sparse daily series the analytics
 * API returns ([{ _id: "YYYY-MM-DD", count }]) — i.e. which days are busiest.
 */
export function weekdayRows(visitorsSeries = [], messagesSeries = []) {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows = names.map((label) => ({ label, visitors: 0, messages: 0 }));
  const add = (series, key) => {
    for (const p of series) {
      const d = new Date(`${p._id}T12:00:00`);
      if (Number.isNaN(d.getTime())) continue;
      rows[(d.getDay() + 6) % 7][key] += p.count || 0;
    }
  };
  add(visitorsSeries, "visitors");
  add(messagesSeries, "messages");
  return rows;
}
