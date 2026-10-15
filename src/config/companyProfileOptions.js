// Mirrors backend/config/industries.js exactly — the backend
// re-validates against that same list regardless of what these
// dropdowns send, same convention as CTA_TYPE_OPTIONS/MODEL_OPTIONS
// elsewhere in this app.
export const INDUSTRY_OPTIONS = [
  { value: "Energy", label: "Energy" },
  { value: "Education", label: "Education" },
  { value: "Digital Marketing", label: "Digital Marketing" },
  { value: "Technology", label: "Technology" },
  { value: "Finance", label: "Finance" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "E-commerce", label: "E-commerce" },
  { value: "Other", label: "Other" },
];

export const COMPANY_SIZE_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-1000", label: "201-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];
