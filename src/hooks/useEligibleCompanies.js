import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Companies the current user can actually create a chatbot for,
 * matching the real backend rule in createChatbot (SUPER_ADMIN, or
 * COMPANY_ADMIN role on that specific company). Computed client-side
 * purely to avoid a confusing "pick a company, then get 403" UX —
 * the backend re-derives and enforces this independently on every
 * request regardless of what this hook returns.
 */
export default function useEligibleCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    if (user.role === "SUPER_ADMIN") {
      api
        .get("/companies", { params: { limit: 100 } })
        .then((res) => setCompanies(res.data.companies || []))
        .catch(() => setCompanies([]))
        .finally(() => setLoading(false));
      return;
    }

    Promise.all([
      api.get(`/users/${user._id}`),
      api.get("/companies", { params: { limit: 100 } }),
    ])
      .then(([userRes, companiesRes]) => {
        const adminCompanyIds = new Set(
          (userRes.data.companyAccess || [])
            .filter((a) => a.role === "COMPANY_ADMIN")
            .map((a) => a.companyId)
        );
        const eligible = (companiesRes.data.companies || []).filter((c) =>
          adminCompanyIds.has(c.companyId)
        );
        setCompanies(eligible);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [user]);

  return { companies, loading };
}
