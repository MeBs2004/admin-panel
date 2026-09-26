import PageHeader from "../../components/ui/PageHeader.jsx";
import DeveloperTabs from "./DeveloperTabs.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4002/api/admin";
const DEVELOPER_BASE = API_URL.replace(/\/api\/admin\/?$/, "/api/v1/developer");

function Code({ children }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 text-xs text-gray-100">
      <code>{children}</code>
    </pre>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
      <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">{children}</div>
    </section>
  );
}

const ENDPOINTS = [
  { method: "GET", path: "/company", scope: "company:read", desc: "The key's own company (id, name, status)." },
  { method: "GET", path: "/chatbots", scope: "chatbots:read", desc: "List chatbots (filtered to the key's chatbot scope, if restricted)." },
  { method: "GET", path: "/chatbots/:id", scope: "chatbots:read", desc: "A single chatbot's detail." },
  { method: "GET", path: "/conversations", scope: "conversations:read", desc: "List conversations, paginated." },
  { method: "GET", path: "/conversations/:visitorId", scope: "conversations:read", desc: "A conversation's message thread." },
  { method: "POST", path: "/conversations/:visitorId/messages", scope: "conversations:write", desc: "Send a reply into a conversation." },
  { method: "GET", path: "/visitors", scope: "visitors:read", desc: "List visitors, paginated." },
  { method: "GET", path: "/analytics", scope: "analytics:read", desc: "Real, aggregated metrics — same engine as the dashboard's Analytics page." },
  { method: "GET", path: "/knowledge", scope: "knowledge:read", desc: "Read the chatbot's knowledge base content." },
  { method: "GET", path: "/webhooks", scope: "webhooks:read", desc: "List this company's developer webhooks." },
  { method: "POST", path: "/webhooks", scope: "webhooks:write", desc: "Create a developer webhook." },
  { method: "PATCH", path: "/webhooks/:id", scope: "webhooks:write", desc: "Update a developer webhook." },
  { method: "DELETE", path: "/webhooks/:id", scope: "webhooks:write", desc: "Delete a developer webhook." },
];

const ERROR_CODES = [
  ["INVALID_API_KEY", "401", "Missing, malformed, or unrecognized API key."],
  ["API_KEY_REVOKED", "403", "The key has been revoked."],
  ["API_KEY_EXPIRED", "403", "The key has passed its expiration date."],
  ["INSUFFICIENT_SCOPE", "403", "The key doesn't have the scope this endpoint requires."],
  ["CHATBOT_ACCESS_DENIED", "403", "The key is restricted to different chatbot(s)."],
  ["COMPANY_ACCESS_DENIED", "403", "The key's company is suspended or no longer exists."],
  ["RATE_LIMITED", "429", "Too many requests in the current window — see Retry-After."],
  ["INVALID_REQUEST", "400", "The request body/query failed validation."],
  ["RESOURCE_NOT_FOUND", "404", "The requested resource doesn't exist (or isn't visible to this key)."],
];

export default function ApiDocumentation() {
  return (
    <div>
      <PageHeader title="API Documentation" description="Everything the Nuformly Developer API v1 actually supports." />

      <div className="mb-4">
        <DeveloperTabs />
      </div>

      <div className="space-y-4">
        <Section title="Authentication">
          <p>
            Every request to the Developer API carries a Bearer token — the raw API key shown once at creation.
            Admin sessions (the JWT used by this dashboard) are never accepted here, and API keys can never log into
            the admin panel — the two authentication systems are entirely separate.
          </p>
          <Code>{`Authorization: Bearer nf_live_YOUR_API_KEY`}</Code>
        </Section>

        <Section title="Base URL">
          <Code>{DEVELOPER_BASE}</Code>
          <p>The current version is <strong>v1</strong>. A breaking future version would be introduced as <code>/api/v2/developer</code>, never by silently changing v1's behavior.</p>
        </Section>

        <Section title="Example Request">
          <Code>{`curl ${DEVELOPER_BASE}/chatbots \\
  -H "Authorization: Bearer nf_live_YOUR_API_KEY"`}</Code>
          <p>Every successful response is shaped:</p>
          <Code>{`{ "success": true, "data": { ... } }`}</Code>
          <p>Every error response is shaped:</p>
          <Code>{`{ "success": false, "error": { "code": "INSUFFICIENT_SCOPE", "message": "..." } }`}</Code>
        </Section>

        <Section title="Scopes">
          <p>
            An API key is granted an explicit set of scopes at creation — only the scope(s) a request needs will
            work. A key may also be restricted to one or more specific chatbots; company-wide access is the default
            when no chatbot is selected.
          </p>
          <table className="w-full text-left text-xs">
            <thead className="text-gray-400">
              <tr>
                <th className="py-1 pr-4">Scope</th>
                <th className="py-1">Grants</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => e.scope).filter((v, i, a) => a.indexOf(v) === i).map((scope) => (
                <tr key={scope} className="border-t border-gray-100 dark:border-white/5">
                  <td className="py-1.5 pr-4 font-mono">{scope}</td>
                  <td className="py-1.5">{ENDPOINTS.find((e) => e.scope === scope)?.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Endpoints">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-400">
              <tr>
                <th className="py-1 pr-3">Method</th>
                <th className="py-1 pr-3">Path</th>
                <th className="py-1 pr-3">Scope</th>
                <th className="py-1">Description</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={e.method + e.path} className="border-t border-gray-100 dark:border-white/5">
                  <td className="py-1.5 pr-3 font-mono font-semibold">{e.method}</td>
                  <td className="py-1.5 pr-3 font-mono">{e.path}</td>
                  <td className="py-1.5 pr-3 font-mono text-gray-400">{e.scope}</td>
                  <td className="py-1.5">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400">
            Writing to chatbot configuration and the knowledge base via the Developer API is not yet supported —
            deliberately left out rather than half-implemented. See Known Limitations in the Phase 12 report.
          </p>
        </Section>

        <Section title="Webhooks">
          <p>
            Events are delivered as a signed POST with a unique <code>id</code>:
          </p>
          <Code>{`{
  "id": "evt_9f2a...",
  "event": "conversation.message",
  "timestamp": "2026-09-23T12:00:00.000Z",
  "companyId": "your-company-id",
  "data": { ... }
}`}</Code>
          <p>
            Verify the <code>X-Nuformly-Signature</code> header (<code>sha256=&lt;hex&gt;</code>) as HMAC-SHA256 of the
            exact raw request body, using the signing secret shown once when the webhook was created:
          </p>
          <Code>{`const expected = crypto
  .createHmac("sha256", signingSecret)
  .update(rawRequestBody)
  .digest("hex");

// Compare against the header's value after "sha256="`}</Code>
          <p>
            A delivery that fails with a network/timeout error is retried once after 500ms. A delivery your endpoint
            responds to with an error status is NOT retried — fix the endpoint and use "Send Test" to verify.
          </p>
        </Section>

        <Section title="Errors">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-400">
              <tr>
                <th className="py-1 pr-3">Code</th>
                <th className="py-1 pr-3">HTTP</th>
                <th className="py-1">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {ERROR_CODES.map(([code, status, meaning]) => (
                <tr key={code} className="border-t border-gray-100 dark:border-white/5">
                  <td className="py-1.5 pr-3 font-mono">{code}</td>
                  <td className="py-1.5 pr-3">{status}</td>
                  <td className="py-1.5">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Rate Limits">
          <p>
            Requests are limited per API key, per minute (default 100 — configurable per company under Developer →
            Settings, 10–1000). Every response carries:
          </p>
          <Code>{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1737590460`}</Code>
          <p>
            Exceeding the limit returns <code>429</code> with <code>{`{"error":{"code":"RATE_LIMITED"}}`}</code> and a
            <code> Retry-After</code> header. This limit is enforced in-memory, per server process — in a
            multi-instance deployment each instance enforces its own window independently, not a single shared
            global limit.
          </p>
        </Section>
      </div>
    </div>
  );
}
