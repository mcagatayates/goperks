"use client";

import { useEffect, useRef, useState } from "react";
import { dictionary } from "@/lib/i18n";
import { IconCheck } from "@/components/icons";

declare global {
  interface Window {
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        params: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID;

type Connection = {
  status: string;
  displayPhoneNumber: string;
  connectedAt: string | null;
} | null;

function loadFacebookSdk(appId: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, xfbml: false, version: "v21.0" });
      resolve();
    };
    if (document.getElementById("facebook-jssdk")) return;
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });
}

export default function WhatsAppConnect({ slug }: { slug: string }) {
  const t = dictionary.admin.whatsapp;
  const [connection, setConnection] = useState<Connection>(null);
  const [metaConfigured, setMetaConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wabaData = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

  function refresh() {
    fetch(`/api/restaurants/${slug}/whatsapp`)
      .then((r) => r.json())
      .then((data) => {
        setConnection(data.connection ?? null);
        setMetaConfigured(Boolean(data.metaConfigured));
        setLoading(false);
      });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === "WA_EMBEDDED_SIGNUP" &&
          data.event === "FINISH" &&
          data.data
        ) {
          wabaData.current = {
            wabaId: data.data.waba_id,
            phoneNumberId: data.data.phone_number_id,
          };
        }
      } catch {
        // not our message, ignore
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function connect() {
    if (!META_APP_ID || !META_CONFIG_ID) return;
    setConnecting(true);
    setError(null);
    wabaData.current = {};

    await loadFacebookSdk(META_APP_ID);

    window.FB!.login(
      async (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setConnecting(false);
          setError(t.popupCancelled);
          return;
        }
        const { wabaId, phoneNumberId } = wabaData.current;
        if (!wabaId || !phoneNumberId) {
          setConnecting(false);
          setError(t.missingWabaData);
          return;
        }
        const res = await fetch(`/api/restaurants/${slug}/whatsapp/connect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, wabaId, phoneNumberId }),
        });
        const data = await res.json();
        setConnecting(false);
        if (!res.ok) {
          setError(data.error ?? t.genericError);
          return;
        }
        setConnection(data.connection);
      },
      {
        config_id: META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {} },
      }
    );
  }

  async function disconnect() {
    await fetch(`/api/restaurants/${slug}/whatsapp`, { method: "DELETE" });
    refresh();
  }

  if (loading) {
    return <p className="text-sm text-muted">{t.loading}</p>;
  }

  if (!metaConfigured) {
    return (
      <div className="rounded-2xl border border-border p-6">
        <h3 className="font-semibold">{t.title}</h3>
        <p className="mt-2 max-w-xl text-sm text-muted">
          {t.notConfigured}
        </p>
      </div>
    );
  }

  const isConnected = connection?.status === "connected";

  return (
    <div className="rounded-2xl border border-border p-6">
      <h3 className="font-semibold">{t.title}</h3>
      {isConnected ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-sm text-accent">
            <IconCheck className="h-4 w-4" />
            {t.connectedTo(connection.displayPhoneNumber)}
          </span>
          <button
            onClick={disconnect}
            className="text-sm text-muted hover:text-foreground"
          >
            {t.disconnect}
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="max-w-xl text-sm text-muted">{t.description}</p>
          <button
            onClick={connect}
            disabled={connecting}
            className="mt-4 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:scale-[1.02] disabled:opacity-40"
          >
            {connecting ? t.connecting : t.connectButton}
          </button>
          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
