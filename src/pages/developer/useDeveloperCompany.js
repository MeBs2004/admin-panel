import { useEffect, useState } from "react";
import api from "../../services/api.js";

const STORAGE_KEY = "nuformly-developer-company";

/**
 * Every Developer page is company-scoped (API keys/webhooks belong
 * to exactly one company — see backend ApiKey/DeveloperWebhook
 * models). This hook is the shared "which company am I managing"
 * picker so each page doesn't reimplement it — companies come from
 * GET /companies, already scoped server-side to what this admin can
 * see (SUPER_ADMIN: all; others: their own). The remembered
 * selection is a per-browser convenience only, same as
 * WorkspaceSwitcher's — every actual request is still independently
 * authorized server-side regardless of what's selected here.
 */
export function useDeveloperCompany() {
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
