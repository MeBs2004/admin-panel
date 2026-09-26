import { useEffect, useState } from "react";
import api from "../../services/api.js";

const STORAGE_KEY = "nuformly-billing-company";

// Same pattern as pages/developer/useDeveloperCompany.js — billing
// is company-scoped too (one BillingAccount per company), so every
// Billing page needs the same "which company am I looking at"
// picker. Kept as its own small copy rather than importing across
// the developer/ folder, matching this app's established preference
// for small per-domain duplication over cross-domain coupling.
export function useBillingCompany() {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/companies", { params: { limit: 100 } })
      .then((res) => {
        const list = res.data.companies || [];
        setCompanies(list);
        setCompanyId((current) => {
          if (current && list.some((c) => c.companyId === current)) return current;
          return list[0]?.companyId || "";
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const selectCompany = (id) => {
    setCompanyId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore storage failures (private mode etc.)
    }
  };

  return { companies, companyId, selectCompany, loading };
}
