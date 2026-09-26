# Nuformly Control Center

Admin frontend for the Nuformly platform. Separate app from `frontend/` (the
public chatbot widget) — different trust model, different auth, kept isolated
so admin changes can never affect the public widget bundle.

## Setup

```bash
npm install
npm run dev
```

Runs on `http://localhost:5174`. Requires the backend running on
`http://localhost:4002` (see `backend/README` / `.env`) with a seeded
Super Admin (`npm run seed:admin` in `backend/`).

Requires Node 20.19+ / 22.12+ (matches the rest of the repo's `.nvmrc`).

## Environment

`.env`:
```
VITE_API_URL=http://localhost:4002/api/admin
```

## Structure

- `src/pages/` — one folder per module (users, companies, chatbots), matching
  the sidebar in `src/components/layout/Sidebar.jsx`.
- `src/components/ui/` — the shared design-system components (Button, Modal,
  DataTable-style tables, StatusBadge, etc.) — extend these rather than
  styling ad hoc.
- `src/context/AuthContext.jsx` — JWT stored in `localStorage`, attached as
  `Authorization: Bearer <token>` by `src/services/api.js`.

Sidebar items marked "Soon" (Conversations, Visitors, Reports, Knowledge
Base, Integrations, Notifications) are intentionally unimplemented — the
underlying admin API doesn't cover them yet. They route to a "Coming Soon"
page rather than faking functionality.
