"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

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

const STATUS_OPTIONS = [
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

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminDashboard({
  slug,
  restaurantName,
}: {
  slug: string;
  restaurantName: string;
}) {
  const [tab, setTab] = useState<"reservations" | "menu" | "conversations">(
    "reservations"
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-black/50 dark:text-white/50">
          HeyTable dashboard
        </p>
        <h1 className="text-3xl font-semibold">{restaurantName}</h1>
      </header>

      <nav className="flex gap-2 border-b border-black/10 pb-2 dark:border-white/10">
        {(
          [
            ["reservations", "Reservations"],
            ["menu", "Menu & Specials"],
            ["conversations", "Conversations"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "reservations" && <ReservationsTab slug={slug} />}
      {tab === "menu" && <MenuTab slug={slug} />}
      {tab === "conversations" && <ConversationsTab slug={slug} />}
    </main>
  );
}

function ReservationsTab({ slug }: { slug: string }) {
  const [date, setDate] = useState(today());
  const [reservations, setReservations] = useState<Reservation[] | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);

  function refresh() {
    fetch(`/api/restaurants/${slug}/reservations?date=${date}`)
      .then((res) => res.json())
      .then((data) => setReservations(data.reservations ?? []));
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/restaurants/${slug}/reservations?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setReservations(data.reservations ?? []);
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

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-black/60 dark:text-white/60">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/15"
          />
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          {showForm ? "Cancel" : "+ New reservation"}
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
        <p className="text-sm text-black/50 dark:text-white/50">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">
          No reservations for this date.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-left text-xs uppercase tracking-wide text-black/50 dark:bg-white/[0.04] dark:text-white/50">
              <tr>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Guest</th>
                <th className="px-4 py-2">Party</th>
                <th className="px-4 py-2">Table</th>
                <th className="px-4 py-2">Channel</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="px-4 py-2">
                    {new Date(r.startsAt).toISOString().slice(11, 16)}
                  </td>
                  <td className="px-4 py-2">
                    <div>{r.customerName}</div>
                    <div className="text-xs text-black/50 dark:text-white/50">
                      {r.customerPhone}
                    </div>
                  </td>
                  <td className="px-4 py-2">{r.partySize}</td>
                  <td className="px-4 py-2">{r.table?.name ?? "—"}</td>
                  <td className="px-4 py-2 capitalize">{r.channel}</td>
                  <td className="px-4 py-2">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${STATUS_COLORS[r.status] ?? ""}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-black/60 dark:text-white/60">
                    {r.notes ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      setError(data.error ?? "Could not create the reservation.");
      return;
    }
    onCreated();
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10"
    >
      <Field label="Time">
        <input
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </Field>
      <Field label="Party size">
        <input
          type="number"
          min={1}
          required
          value={partySize}
          onChange={(e) => setPartySize(Number(e.target.value))}
          className="w-20 rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </Field>
      <Field label="Guest name">
        <input
          required
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </Field>
      <Field label="Phone">
        <input
          required
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </Field>
      <Field label="Notes">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="optional"
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </Field>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
      >
        {submitting ? "Booking…" : "Book table"}
      </button>
      {error && (
        <p className="w-full text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-black/60 dark:text-white/60">
      {label}
      {children}
    </label>
  );
}

function MenuTab({ slug }: { slug: string }) {
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
    if (!confirm("Remove this item from the menu?")) return;
    await fetch(`/api/restaurants/${slug}/menu-items/${id}`, {
      method: "DELETE",
    });
    refresh();
  }

  return (
    <section className="grid gap-6 sm:grid-cols-2">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Menu & specials</h2>
          <button
            onClick={() => setShowItemForm((v) => !v)}
            className="rounded-full border border-black/15 px-3 py-1 text-xs font-medium dark:border-white/20"
          >
            {showItemForm ? "Cancel" : "+ Add item"}
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

        <ul className="mt-3 flex flex-col gap-2">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.name}</span>
                <span className="text-black/50 dark:text-white/50">
                  ₺{item.price}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-black/50 dark:text-white/50">
                <span className="capitalize">{item.category}</span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={item.isSpecial}
                    onChange={(e) =>
                      patchMenuItem(item.id, { isSpecial: e.target.checked })
                    }
                  />
                  special
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={item.isAvailable}
                    onChange={(e) =>
                      patchMenuItem(item.id, { isAvailable: e.target.checked })
                    }
                  />
                  available
                </label>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="text-red-600 hover:underline dark:text-red-400"
                >
                  remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Tables</h2>
          <button
            onClick={() => setShowTableForm((v) => !v)}
            className="rounded-full border border-black/15 px-3 py-1 text-xs font-medium dark:border-white/20"
          >
            {showTableForm ? "Cancel" : "+ Add table"}
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

        <ul className="mt-3 flex flex-col gap-2">
          {tables.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
            >
              <span>{t.name}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50">
                  seats
                  <input
                    type="number"
                    min={1}
                    defaultValue={t.capacity}
                    onBlur={(e) => {
                      const capacity = Number(e.target.value);
                      if (capacity !== t.capacity && capacity >= 1) {
                        patchTable(t.id, { capacity });
                      }
                    }}
                    className="w-14 rounded-lg border border-black/10 bg-transparent px-1.5 py-1 text-sm dark:border-white/15"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50">
                  <input
                    type="checkbox"
                    checked={t.isActive}
                    onChange={(e) =>
                      patchTable(t.id, { isActive: e.target.checked })
                    }
                  />
                  active
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
      setError(data.error ?? "Could not add the table.");
      return;
    }
    onCreated();
  }

  return (
    <form
      onSubmit={submit}
      className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10"
    >
      <Field label="Name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="T9"
          className="w-24 rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </Field>
      <Field label="Capacity">
        <input
          type="number"
          min={1}
          required
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          className="w-20 rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </Field>
      <button
        type="submit"
        className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        Add table
      </button>
      {error && (
        <p className="w-full text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("main");
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
      setError(data.error ?? "Could not add the item.");
      return;
    }
    onCreated();
  }

  return (
    <form
      onSubmit={submit}
      className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10"
    >
      <Field label="Name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </Field>
      <Field label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        >
          <option value="starter">starter</option>
          <option value="main">main</option>
          <option value="dessert">dessert</option>
          <option value="drink">drink</option>
        </select>
      </Field>
      <Field label="Price (₺)">
        <input
          type="number"
          min={0}
          required
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-24 rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </Field>
      <Field label="Description">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
        />
      </Field>
      <label className="flex items-center gap-1 pb-1.5 text-xs text-black/60 dark:text-white/60">
        <input
          type="checkbox"
          checked={isSpecial}
          onChange={(e) => setIsSpecial(e.target.checked)}
        />
        special
      </label>
      <button
        type="submit"
        className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        Add item
      </button>
      {error && (
        <p className="w-full text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}

function ConversationsTab({ slug }: { slug: string }) {
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

  return (
    <section className="grid gap-6 sm:grid-cols-[280px_1fr]">
      <ul className="flex flex-col gap-2">
        {sessions.length === 0 && (
          <p className="text-sm text-black/50 dark:text-white/50">
            No conversations yet.
          </p>
        )}
        {sessions.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => openSession(s.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                selected?.id === s.id
                  ? "border-black/30 dark:border-white/40"
                  : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/25"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{s.channel}</span>
                <span className="text-xs text-black/40 dark:text-white/40">
                  {s._count.messages} msgs
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-black/50 dark:text-white/50">
                {s.messages[0]?.content ?? ""}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        {!selected ? (
          <p className="text-sm text-black/50 dark:text-white/50">
            Select a conversation to view the transcript.
          </p>
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
                      ? "bg-neutral-900 text-white dark:bg-neutral-700"
                      : "bg-black/5 dark:bg-white/10"
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
