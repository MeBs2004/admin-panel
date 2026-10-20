// Ranking for the ⌘K palette: every word typed must appear in the item's
// label / group / keywords; matches at the start of a word rank higher.
export function scoreItem(item, tokens) {
  const hay = `${item.label} ${item.group || ""} ${item.keywords || ""}`.toLowerCase();
  let total = 0;
  for (const t of tokens) {
    const i = hay.indexOf(t);
    if (i === -1) return -1;
    total += i === 0 || hay[i - 1] === " " ? 2 : 1;
  }
  return total;
}

export function filterItems(items, query) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return items;
  return items
    .map((it) => ({ it, s: scoreItem(it, tokens) }))
    .filter((r) => r.s >= 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.it);
}
