"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { dictionary } from "@/lib/i18n";

export default function LoginForm() {
  const t = dictionary.auth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? t.genericError);
      return;
    }
    const next = searchParams.get("next");
    router.push(next || `/admin/${data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">{t.emailLabel}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">{t.passwordLabel}</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition focus:border-accent"
        />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:scale-[1.02] disabled:opacity-40"
      >
        {submitting ? t.loginSubmitting : t.loginSubmit}
      </button>

      <p className="text-center text-sm text-muted">
        {t.noAccount}{" "}
        <Link href="/kayit" className="text-accent hover:underline">
          {t.signupLink}
        </Link>
      </p>
    </form>
  );
}
