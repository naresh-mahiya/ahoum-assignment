import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronDown,
  Download,
  Pencil,
  Plus,
  Send,
  Ticket,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { listSessionBookings } from '@/api/bookings';
import SessionForm from '@/components/sessions/SessionForm';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { useMySessions, useSessionMutations } from '@/hooks/useSessions';
import { formatDateTime, formatPrice } from '@/lib/format';
import type { Session } from '@/types';

type Tab = 'sessions' | 'bookings';

const statusTone = (s: Session['status']) =>
  s === 'published'
    ? 'green'
    : s === 'draft'
      ? 'amber'
      : s === 'cancelled'
        ? 'red'
        : 'slate';

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ticket;
  label: string;
  value: number | string;
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function SessionBookings({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['session-bookings', session.id],
    queryFn: () => listSessionBookings(session.id),
    enabled: open,
  });

  const exportCsv = () => {
    if (!data || data.length === 0) return;
    const rows = [
      ['Name', 'Email', 'Status', 'Payment', 'Booked at'],
      ...data.map((b) => [
        `${b.user.first_name} ${b.user.last_name}`.trim() || b.user.email,
        b.user.email,
        b.status,
        b.payment_status,
        new Date(b.booked_at).toISOString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${session.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const booked = session.confirmed_bookings_count;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50"
      >
        <div>
          <p className="font-semibold text-slate-900">{session.title}</p>
          <p className="text-sm text-slate-500">
            {booked} / {session.capacity} booked · {formatDateTime(session.scheduled_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone(session.status)}>{session.status}</Badge>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4">
          {isLoading ? (
            <div className="grid place-items-center py-6">
              <Spinner className="text-brand-500" />
            </div>
          ) : data && data.length > 0 ? (
            <>
              <div className="mb-3 flex justify-end">
                <Button variant="secondary" onClick={exportCsv}>
                  <Download size={15} /> Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-4">Attendee</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((b) => (
                      <tr key={b.id}>
                        <td className="py-2 pr-4">
                          <p className="font-medium text-slate-800">
                            {`${b.user.first_name} ${b.user.last_name}`.trim() ||
                              b.user.email}
                          </p>
                          <p className="text-xs text-slate-400">{b.user.email}</p>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge tone={b.status === 'confirmed' ? 'green' : 'amber'}>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-slate-600">{b.payment_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">
              No bookings yet for this session.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreatorDashboard() {
  const { data: sessions, isLoading } = useMySessions();
  const { remove, publish, cancel } = useSessionMutations();
  const [tab, setTab] = useState<Tab>('sessions');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Session | undefined>();

  const stats = useMemo(() => {
    const list = sessions ?? [];
    const totalBookings = list.reduce(
      (acc, s) => acc + s.confirmed_bookings_count,
      0
    );
    const revenue = list.reduce(
      (acc, s) =>
        acc + (s.is_free ? 0 : Number(s.price) * s.confirmed_bookings_count),
      0
    );
    const upcoming = list.filter(
      (s) => new Date(s.scheduled_at).getTime() > Date.now()
    ).length;
    return {
      total: list.length,
      totalBookings,
      upcoming,
      revenue,
    };
  }, [sessions]);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (s: Session) => {
    setEditing(s);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Creator Studio</h1>
          <p className="text-sm text-slate-500">
            Create sessions and track your attendees.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Create new session
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Sessions" value={stats.total} />
        <StatCard icon={Users} label="Total bookings" value={stats.totalBookings} />
        <StatCard icon={Ticket} label="Upcoming" value={stats.upcoming} />
        <StatCard
          icon={TrendingUp}
          label="Revenue"
          value={`$${stats.revenue.toFixed(0)}`}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {(['sessions', 'bookings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === t
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t === 'sessions' ? 'My Sessions' : 'Bookings Overview'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Spinner className="text-brand-500" size={28} />
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No sessions yet"
          description="Create your first session and it’ll appear in the catalog once published."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} /> Create your first session
            </Button>
          }
        />
      ) : tab === 'sessions' ? (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/sessions/${s.id}`}
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    {s.title}
                  </Link>
                  <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {formatDateTime(s.scheduled_at)} ·{' '}
                  {formatPrice(s.price, s.is_free)} ·{' '}
                  {s.confirmed_bookings_count}/{s.capacity} booked
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {s.status === 'draft' && (
                  <Button
                    variant="secondary"
                    loading={publish.isPending}
                    onClick={() => publish.mutate(s.id)}
                  >
                    <Send size={14} /> Publish
                  </Button>
                )}
                {s.status === 'published' && (
                  <Button
                    variant="ghost"
                    loading={cancel.isPending}
                    onClick={() => cancel.mutate(s.id)}
                  >
                    Cancel
                  </Button>
                )}
                <Button variant="secondary" onClick={() => openEdit(s)}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm(`Delete “${s.title}”? This cannot be undone.`)) {
                      remove.mutate(s.id);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <SessionBookings key={s.id} session={s} />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit session' : 'Create session'}
        size="lg"
      >
        <SessionForm initial={editing} onDone={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}
