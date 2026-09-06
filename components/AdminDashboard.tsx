"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { dictionary } from "@/lib/i18n";
import type { Channel, ReservationStatus } from "@/lib/types";
import {
  IconCalendar,
  IconChat,
  IconPlus,
} from "@/components/icons";
import WhatsAppConnect from "@/components/WhatsAppConnect";

type Table = { id: string; name: string; capacity: number; isActive: boolean };
type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isSpecial: boolean;
  isAvailable: boolean;
};
type Reservation = {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  startsAt: string;
  status: string;
  channel: string;
  notes: string | null;
  table: Table | null;
};
type WaitlistEntry = {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  requestedTime: string;
  status: string;
  notes: string | null;
};
type SessionSummary = {
  id: string;
  channel: string;
  externalId: string | null;
  customerName: string | null;
  updatedAt: string;
  messages: { content: string; role: string }[];
  _count: { messages: number };
};
type SessionDetail = {
  id: string;
  channel: string;
  messages: { id: string; role: string; content: string; createdAt: string }[];
};

const STATUS_OPTIONS: ReservationStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-green-500/15 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
  completed: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  no_show: "bg-neutral-500/15 text-neutral-700 dark:text-neutral-400",
};

const WAITLIST_STATUS_OPTIONS = ["waiting", "seated", "cancelled"] as const;

const WAITLIST_STATUS_COLORS: Record<string, string> = {
  waiting: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  seated: "bg-green-500/15 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted">
        {icon}
      </span>
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

export default function AdminDashboard({
  slug,
  restaurantName,
  ownerEmail,
}: {
  slug: string;
  restaurantName: string;
  ownerEmail: string | null;
}) {
  const t = dictionary.admin;
  const router = useRouter();
  const [tab, setTab] = useState<
    "reservations" | "menu" | "conversations" | "settings"
  >("reservations");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="font-display text-xs font-medium tracking-tight text-muted hover:text-accent"
        >
          {t.dashboardLabel}
        </Link>
        {ownerEmail && (
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>{ownerEmail}</span>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/");
                router.refresh();
              }}
              className="hover:text-foreground"
            >
              {t.logout}
            </button>
          </div>
        )}
      </div>

      <h1 className="font-display text-3xl tracking-tight">
        {restaurantName}
      </h1>

      <nav className="flex gap-2 border-b border-border pb-2">
        {(
          [
            ["reservations", t.tabs.reservations],
            ["menu", t.tabs.menu],
            ["conversations", t.tabs.conversations],
            ["settings", t.tabs.settings],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-foreground text-background"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "reservations" && <ReservationsTab slug={slug} />}
      {tab === "menu" && <MenuTab slug={slug} />}
      {tab === "conversations" && <ConversationsTab slug={slug} />}
      {tab === "settings" && <WhatsAppConnect slug={slug} />}
    </main>
  );
}

function ReservationsTab({ slug }: { slug: string }) {
  const t = dictionary.admin;
  const [date, setDate] = useState(today());
  const [reservations, setReservations] = useState<Reservation[] | null>(
    null
  );
  const [waitlist, setWaitlist] = useState<WaitlistEntry[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  function refresh() {
    fetch(`/api/restaurants/${slug}/reservations?date=${date}`)
      .then((res) => res.json())
      .then((data) => setReservations(data.reservations ?? []));
    fetch(`/api/restaurants/${slug}/waitlist?date=${date}`)
      .then((res) => res.json())
      .then((data) => setWaitlist(data.entries ?? []));
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/restaurants/${slug}/reservations?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setReservations(data.reservations ?? []);
      });
    fetch(`/api/restaurants/${slug}/waitlist?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setWaitlist(data.entries ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, date]);

  const loading = reservations === null;
  const list = reservations ?? [];

  async function updateStatus(id: string, status: string) {
    setReservations(
      (prev) => prev?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null
    );
    await fetch(`/api/restaurants/${slug}/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function updateWaitlistEntryStatus(id: string, status: string) {
    setWaitlist(
      (prev) => prev?.map((w) => (w.id === id ? { ...w, status } : w)) ?? null
    );
    await fetch(`/api/restaurants/${slug}/waitlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted">
            {t.reservations.dateLabel}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm tabular-nums transition focus:border-accent"
          />
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition hover:scale-[1.02]"
        >
          {showForm ? (
            t.reservations.cancelButton
          ) : (
            <>
              <IconPlus className="h-3.5 w-3.5" />
              {t.reservations.newButton}
            </>
          )}
        </button>
      </div>

      {showForm && (
        <NewReservationForm
          slug={slug}
          defaultDate={date}
          onCreated={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-muted">{t.reservations.loading}</p>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<IconCalendar className="h-5 w-5" />}
          message={t.reservations.empty}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2">{t.reservations.colTime}</th>
                <th className="px-4 py-2">{t.reservations.colGuest}</th>
                <th className="px-4 py-2">{t.reservations.colParty}</th>
                <th className="px-4 py-2">{t.reservations.colTable}</th>
                <th className="px-4 py-2">{t.reservations.colChannel}</th>
                <th className="px-4 py-2">{t.reservations.colStatus}</th>
                <th className="px-4 py-2">{t.reservations.colNotes}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 tabular-nums">
                    {new Date(r.startsAt).toISOString().slice(11, 16)}
                  </td>
                  <td className="px-4 py-2">
                    <div>{r.customerName}</div>
                    <div className="text-xs text-muted">
                      {r.customerPhone}
                    </div>
                  </td>
                  <td className="px-4 py-2 tabular-nums">{r.partySize}</td>
                  <td className="px-4 py-2">{r.table?.name ?? "—"}</td>
                  <td className="px-4 py-2">
                    {t.channelLabels[r.channel as Channel] ?? r.channel}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${STATUS_COLORS[r.status] ?? ""}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {t.statusLabels[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-muted">{r.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {waitlist && waitlist.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">{t.waitlist.title}</h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2">{t.waitlist.colTime}</th>
                  <th className="px-4 py-2">{t.waitlist.colGuest}</th>
                  <th className="px-4 py-2">{t.waitlist.colParty}</th>
                  <th className="px-4 py-2">{t.waitlist.colStatus}</th>
                  <th className="px-4 py-2">{t.waitlist.colNotes}</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((w) => (
                  <tr key={w.id} className="border-t border-border">
                    <td className="px-4 py-2 tabular-nums">{w.requestedTime}</td>
                    <td className="px-4 py-2">
                      <div>{w.customerName}</div>
                      <div className="text-xs text-muted">{w.customerPhone}</div>
                    </td>
                    <td className="px-4 py-2 tabular-nums">{w.partySize}</td>
                    <td className="px-4 py-2">
                      <select
                        value={w.status}
                        onChange={(e) =>
                          updateWaitlistEntryStatus(w.id, e.target.value)
                        }
                        className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${WAITLIST_STATUS_COLORS[w.status] ?? ""}`}
                      >
                        {WAITLIST_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {t.waitlist.statusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-muted">{w.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function NewReservationForm({
  slug,
  defaultDate,
  onCreated,
}: {
  slug: string;
  defaultDate: string;
  onCreated: () => void;
}) {
  const t = dictionary.admin.newReservationForm;
  const [time, setTime] = useState("19:00");
  const [partySize, setPartySize] = useState(2);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/restaurants/${slug}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: defaultDate,
        time,
        partySize,
        customerName,
        customerPhone,
        notes: notes || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? t.genericError);
      return;
    }
    onCreated();
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4"
    >
      <Field label={t.timeLabel}>
        <input
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm tabular-nums transition focus:border-accent"
        />
      </Field>
      <Field label={t.partySizeLabel}>
        <input
          type="number"
          min={1}
          required
          value={partySize}
          onChange={(e) => setPartySize(Number(e.target.value))}
          className="w-20 rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.nameLabel}>
        <input
          required
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.phoneLabel}>
        <input
          required
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.notesLabel}>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPlaceholder}
          className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm transition focus:border-accent"
        />
      </Field>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition hover:scale-[1.02] disabled:opacity-40"
      >
        {submitting ? t.submitting : t.submit}
      </button>
      {error && <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      {children}
    </label>
  );
}

function MenuTab({ slug }: { slug: string }) {
  const t = dictionary.admin;
  const categoryOptions = t.newMenuItemForm.categoryOptions;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [showTableForm, setShowTableForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);

  function refresh() {
    fetch(`/api/restaurants/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setMenuItems(data.restaurant?.menuItems ?? []);
        setTables(data.restaurant?.tables ?? []);
      });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function patchTable(id: string, patch: Partial<Table>) {
    await fetch(`/api/restaurants/${slug}/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    refresh();
  }

  async function patchMenuItem(
    id: string,
    patch: Partial<Pick<MenuItem, "isSpecial" | "isAvailable" | "price">>
  ) {
    await fetch(`/api/restaurants/${slug}/menu-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    refresh();
  }

  async function deleteMenuItem(id: string) {
    if (!confirm(t.menu.confirmDelete)) return;
    await fetch(`/api/restaurants/${slug}/menu-items/${id}`, {
      method: "DELETE",
    });
    refresh();
  }

  return (
    <section className="grid gap-8 sm:grid-cols-2">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t.menu.menuTitle}</h2>
          <button
            onClick={() => setShowItemForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium transition hover:border-accent/50 hover:text-accent"
          >
            {showItemForm ? (
              t.reservations.cancelButton
            ) : (
              <>
                <IconPlus className="h-3 w-3" />
                {t.menu.addItemButton}
              </>
            )}
          </button>
        </div>

        {showItemForm && (
          <NewMenuItemForm
            slug={slug}
            onCreated={() => {
              setShowItemForm(false);
              refresh();
            }}
          />
        )}

        <ul className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.name}</span>
                <span className="tabular-nums text-muted">
                  ₺{item.price}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>
                  {categoryOptions.find((c) => c.value === item.category)
                    ?.label ?? item.category}
                </span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={item.isSpecial}
                    onChange={(e) =>
                      patchMenuItem(item.id, { isSpecial: e.target.checked })
                    }
                  />
                  {t.menu.specialLabel}
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={item.isAvailable}
                    onChange={(e) =>
                      patchMenuItem(item.id, { isAvailable: e.target.checked })
                    }
                  />
                  {t.menu.availableLabel}
                </label>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="text-red-600 hover:underline dark:text-red-400"
                >
                  {t.menu.removeLabel}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t.menu.tablesTitle}</h2>
          <button
            onClick={() => setShowTableForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium transition hover:border-accent/50 hover:text-accent"
          >
            {showTableForm ? (
              t.reservations.cancelButton
            ) : (
              <>
                <IconPlus className="h-3 w-3" />
                {t.menu.addTableButton}
              </>
            )}
          </button>
        </div>

        {showTableForm && (
          <NewTableForm
            slug={slug}
            onCreated={() => {
              setShowTableForm(false);
              refresh();
            }}
          />
        )}

        <ul className="flex flex-col gap-2">
          {tables.map((tbl) => (
            <li
              key={tbl.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>{tbl.name}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-muted">
                  {t.menu.seatsLabel}
                  <input
                    type="number"
                    min={1}
                    defaultValue={tbl.capacity}
                    onBlur={(e) => {
                      const capacity = Number(e.target.value);
                      if (capacity !== tbl.capacity && capacity >= 1) {
                        patchTable(tbl.id, { capacity });
                      }
                    }}
                    className="w-14 rounded-lg border border-border bg-transparent px-1.5 py-1 text-sm tabular-nums transition focus:border-accent"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={tbl.isActive}
                    onChange={(e) =>
                      patchTable(tbl.id, { isActive: e.target.checked })
                    }
                  />
                  {t.menu.activeLabel}
                </label>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function NewTableForm({
  slug,
  onCreated,
}: {
  slug: string;
  onCreated: () => void;
}) {
  const t = dictionary.admin.newTableForm;
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/restaurants/${slug}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, capacity }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t.genericError);
      return;
    }
    onCreated();
  }

  return (
    <form
      onSubmit={submit}
      className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-border p-3"
    >
      <Field label={t.nameLabel}>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          className="w-24 rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.capacityLabel}>
        <input
          type="number"
          min={1}
          required
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          className="w-20 rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm transition focus:border-accent"
        />
      </Field>
      <button
        type="submit"
        className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition hover:scale-[1.02]"
      >
        {t.submit}
      </button>
      {error && <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function NewMenuItemForm({
  slug,
  onCreated,
}: {
  slug: string;
  onCreated: () => void;
}) {
  const t = dictionary.admin.newMenuItemForm;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState(t.categoryOptions[1].value);
  const [isSpecial, setIsSpecial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/restaurants/${slug}/menu-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, price, category, isSpecial }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t.genericError);
      return;
    }
    onCreated();
  }

  return (
    <form
      onSubmit={submit}
      className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-border p-3"
    >
      <Field label={t.nameLabel}>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.categoryLabel}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm transition focus:border-accent"
        >
          {t.categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t.priceLabel}>
        <input
          type="number"
          min={0}
          required
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-24 rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm transition focus:border-accent"
        />
      </Field>
      <Field label={t.descriptionLabel}>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm transition focus:border-accent"
        />
      </Field>
      <label className="flex items-center gap-1 pb-1.5 text-xs text-muted">
        <input
          type="checkbox"
          checked={isSpecial}
          onChange={(e) => setIsSpecial(e.target.checked)}
        />
        {t.specialLabel}
      </label>
      <button
        type="submit"
        className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition hover:scale-[1.02]"
      >
        {t.submit}
      </button>
      {error && <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function ConversationsTab({ slug }: { slug: string }) {
  const t = dictionary.admin;
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selected, setSelected] = useState<SessionDetail | null>(null);

  useEffect(() => {
    fetch(`/api/restaurants/${slug}/sessions`)
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []));
  }, [slug]);

  async function openSession(id: string) {
    const res = await fetch(`/api/restaurants/${slug}/sessions/${id}`);
    const data = await res.json();
    setSelected(data.session);
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<IconChat className="h-5 w-5" />}
        message={t.conversations.empty}
      />
    );
  }

  return (
    <section className="grid gap-6 sm:grid-cols-[280px_1fr]">
      <ul className="flex flex-col gap-2">
        {sessions.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => openSession(s.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                selected?.id === s.id
                  ? "border-accent/50"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {t.channelLabels[s.channel as Channel] ?? s.channel}
                </span>
                <span className="text-xs text-muted">
                  {s._count.messages} {t.conversations.msgsSuffix}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted">
                {s.messages[0]?.content ?? ""}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-border p-4">
        {!selected ? (
          <p className="text-sm text-muted">{t.conversations.selectPrompt}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {selected.messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-surface"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
