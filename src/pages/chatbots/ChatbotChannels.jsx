import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiGlobe, FiSend } from "react-icons/fi";
import { FaTelegram, FaWhatsapp, FaInstagram, FaFacebookMessenger } from "react-icons/fa";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

const ICONS = { website: FiGlobe, telegram: FaTelegram, whatsapp: FaWhatsapp, instagram: FaInstagram, messenger: FaFacebookMessenger };

function ChannelCard({ icon: Icon, title, status, children }) {
  return (
    <div className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        </div>
        <StatusBadge status={status} />
      </div>
      {children}
    </div>
  );
}

function WebsiteCard({ channel, chatbotId, onSaved }) {
  const { showToast } = useToast();
  const [domains, setDomains] = useState((channel.config?.allowedDomains || []).join(", "));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const list = domains.split(",").map((d) => d.trim()).filter(Boolean);
      await api.put(`/chatbots/${chatbotId}/channels/website`, { allowedDomains: list });
      showToast("Allowed domains saved.");
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ChannelCard icon={ICONS.website} title="Website" status={channel.status}>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        The public chat widget. "Connected" means this chatbot has processed at least one real conversation — not
        just that a snippet was pasted somewhere (see Installation for the embed code).
      </p>
      <Input
        label="Allowed domains (comma-separated, optional)"
        value={domains}
        onChange={(e) => setDomains(e.target.value)}
        placeholder="example.com, www.example.com"
      />
      <Button className="mt-3" onClick={save} loading={saving}>
        Save
      </Button>
    </ChannelCard>
  );
}

function TelegramCard({ channel, chatbotId, onSaved, canManage }) {
  const { showToast } = useToast();
  const [botToken, setBotToken] = useState("");
  const [busy, setBusy] = useState(false);
  const isConnected = channel.status === "CONNECTED";

  const connect = async () => {
    setBusy(true);
    try {
      await api.post(`/chatbots/${chatbotId}/channels/telegram/connect`, { botToken });
      showToast("Telegram connected.");
      setBotToken("");
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/chatbots/${chatbotId}/channels/telegram/test`);
      showToast(res.data.result.ok ? `Connected as @${res.data.result.botUsername}` : res.data.result.error, res.data.result.ok ? "success" : "error");
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await api.post(`/chatbots/${chatbotId}/channels/telegram/disconnect`);
      showToast("Telegram disconnected.");
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ChannelCard icon={ICONS.telegram} title="Telegram" status={channel.status}>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Uses the official Telegram Bot API. Get a bot token from{" "}
        <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
          @BotFather
        </a>
        .
      </p>

      {isConnected ? (
        <>
          <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">Bot: @{channel.config?.botUsername}</p>
          {channel.lastError && <p className="mb-2 text-xs text-danger-500">Last error: {channel.lastError}</p>}
          {canManage && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={test} loading={busy}>
                <FiSend className="h-3.5 w-3.5" /> Test
              </Button>
              <Button variant="danger" onClick={disconnect} loading={busy}>
                Disconnect
              </Button>
            </div>
          )}
        </>
      ) : canManage ? (
        <>
          <Input label="Bot token" value={botToken} onChange={(e) => setBotToken(e.target.value)} type="password" placeholder="123456:ABC-DEF..." />
          {channel.lastError && <p className="mt-1 text-xs text-danger-500">{channel.lastError}</p>}
          <Button className="mt-3" onClick={connect} loading={busy} disabled={!botToken}>
            Connect
          </Button>
        </>
      ) : (
        <p className="text-xs text-gray-400">Not connected. A company admin can configure this.</p>
      )}
    </ChannelCard>
  );
}

function ComingSoonCard({ icon: Icon, title }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 dark:bg-white/[0.02] dark:border-[var(--border)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/5">
            {Icon && <Icon className="h-4 w-4" />}
          </span>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400 dark:bg-white/5">Coming soon</span>
      </div>
      <p className="text-xs text-gray-400">Requires official provider credentials that aren't configured on this platform yet.</p>
    </div>
  );
}

export default function ChatbotChannels() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [channels, setChannels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/chatbots/${id}/channels`)
      .then((res) => setChannels(res.data.channels))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-32 w-full" />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!channels) return null;

  const website = channels.find((c) => c.key === "website");
  const telegram = channels.find((c) => c.key === "telegram");
  const comingSoon = channels.filter((c) => !c.implemented);

  return (
    <div>
      <PageHeader
        title="Channels"
        description="Where visitors reach this chatbot."
        breadcrumbs={[{ label: "Chatbots", to: "/chatbots" }, { label: "Chatbot", to: `/chatbots/${id}` }, { label: "Channels" }]}
        action={
          <Button variant="secondary" onClick={() => navigate(`/chatbots/${id}`)}>
            Back to Chatbot
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {website && <WebsiteCard channel={website} chatbotId={id} onSaved={load} />}
        {telegram && <TelegramCard channel={telegram} chatbotId={id} onSaved={load} canManage />}
        {comingSoon.map((c) => (
          <ComingSoonCard key={c.key} icon={ICONS[c.key]} title={c.label} />
        ))}
      </div>
    </div>
  );
}
