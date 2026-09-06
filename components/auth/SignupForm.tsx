"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { dictionary } from "@/lib/i18n";

export default function SignupForm() {
  const t = dictionary.auth;
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("23:00");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantName,
        slug: slug || undefined,
        email,
        password,
        address,
        phone,
        description: description || undefined,
        openTime,
        closeTime,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? t.genericError);
      return;
    }
    router.push(`/admin/${data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label={t.restaurantNameLabel}>
        <input
          required
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.slugLabel} hint={t.slugHint + (slug || "...")}>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="masa19"
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.emailLabel}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.passwordLabel} hint={t.passwordHint}>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.addressLabel}>
        <input
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.phoneLabel}>
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.descriptionLabel}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.descriptionPlaceholder}
          rows={2}
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition focus:border-accent"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.openTimeLabel}>
          <input
            type="time"
            required
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm tabular-nums transition focus:border-accent"
          />
        </Field>
        <Field label={t.closeTimeLabel}>
          <input
            type="time"
            required
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm tabular-nums transition focus:border-accent"
          />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:scale-[1.02] disabled:opacity-40"
      >
        {submitting ? t.signupSubmitting : t.signupSubmit}
      </button>

      <p className="text-center text-sm text-muted">
        {t.haveAccount}{" "}
        <Link href="/giris" className="text-accent hover:underline">
          {t.loginLink}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}
