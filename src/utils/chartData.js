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
