"use client";

import { useEffect, useState } from "react";
import { dictionary } from "@/lib/i18n";
import { IconCheck } from "@/components/icons";

type PosSettings = {
  hasApiKey: boolean;
  apiKey: string | null;
  posWebhookUrl: string | null;
  posWebhookSecret: string | null;
};

function CopyButton({ value }: { value: string }) {
  const t = dictionary.admin.pos;
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore
        }
      }}
      className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
    >
      {copied ? (
        <>
          <IconCheck className="h-3 w-3 text-accent" />
          {t.copied}
        </>
      ) : (
        t.copy
      )}
    </button>
  );
}

export default function PosIntegration({ slug }: { slug: string }) {
  const t = dictionary.admin.pos;
  const [settings, setSettings] = useState<PosSettings | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/restaurants/${slug}/pos`)
      .then((r) => r.json())
      .then((data: PosSettings) => {
        setSettings(data);
        setWebhookUrl(data.posWebhookUrl ?? "");
      });
  }, [slug]);

  async function generateApiKey() {
    setGenerating(true);
    setError(null);
    const res = await fetch(`/api/restaurants/${slug}/pos/api-key`, {
      method: "POST",
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(data.error ?? t.genericError);
      return;
    }
    setSettings((prev) =>
      prev ? { ...prev, hasApiKey: true, apiKey: data.apiKey } : prev
    );
  }

  async function saveWebhook() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/restaurants/${slug}/pos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posWebhookUrl: webhookUrl || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? t.genericError);
      return;
    }
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            posWebhookUrl: data.posWebhookUrl,
            posWebhookSecret: data.posWebhookSecret,
          }
        : prev
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border p-6">
      <h3 className="font-semibold">{t.title}</h3>
      <p className="mt-2 max-w-xl text-sm text-muted">{t.description}</p>

      <div className="mt-5 flex flex-col gap-2">
        <span className="text-sm font-medium">{t.apiKeyLabel}</span>
        {settings.apiKey ? (
          <div className="flex flex-wrap items-center gap-3">
            <code className="rounded-lg bg-surface px-3 py-1.5 text-xs">
              {settings.apiKey}
            </code>
            <CopyButton value={settings.apiKey} />
          </div>
        ) : (
          <p className="text-xs text-muted">{t.apiKeyHint}</p>
        )}
        <button
          onClick={generateApiKey}
          disabled={generating}
          className="mt-1 w-fit rounded-full border border-border px-4 py-1.5 text-xs font-medium transition hover:border-accent/50 hover:text-accent disabled:opacity-40"
        >
          {settings.hasApiKey ? t.regenerateApiKey : t.generateApiKey}
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{t.webhookUrlLabel}</span>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder={t.webhookUrlPlaceholder}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition focus:border-accent"
          />
        </label>
        {settings.posWebhookSecret && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">
              {t.webhookSecretLabel}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <code className="rounded-lg bg-surface px-3 py-1.5 text-xs">
                {settings.posWebhookSecret}
              </code>
              <CopyButton value={settings.posWebhookSecret} />
            </div>
            <p className="text-xs text-muted">{t.webhookSecretHint}</p>
          </div>
        )}
        <button
          onClick={saveWebhook}
          disabled={saving}
          className="mt-1 w-fit rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition hover:scale-[1.02] disabled:opacity-40"
        >
          {saving ? t.saving : t.save}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
