// Shared filter/status vocabulary for the inbox (list pane + detail
// pane), so both stay in sync with exactly what the backend supports
// — no filter here is decorative/fake.
export const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "CLOSED", label: "Closed" },
];

export const MODE_FILTERS = [
  { value: "", label: "Any mode" },
  { value: "AI", label: "AI" },
  { value: "HUMAN", label: "Human" },
];

export const ASSIGNED_FILTERS = [
  { value: "any", label: "Anyone" },
  { value: "me", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
];

export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
