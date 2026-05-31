import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Sparkles,
  Ticket,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useBookingMutations, useMyBookings } from '@/hooks/useBookings';
import { formatDateTime, formatPrice, gradientFor, isUpcoming } from '@/lib/format';
import type { Booking } from '@/types';

type Tab = 'bookings' | 'profile';
type BookingTab = 'upcoming' | 'past' | 'cancelled';

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

function BookingRow({ booking }: { booking: Booking }) {
  const { cancel } = useBookingMutations();
  const { session } = booking;
  const statusTone =
    booking.status === 'confirmed'
      ? 'green'
      : booking.status === 'cancelled'
        ? 'red'
        : booking.status === 'pending'
          ? 'amber'
          : 'slate';

  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link to={`/sessions/${session.id}`} className="shrink-0">
        {session.cover_image ? (
          <img
            src={session.cover_image}
            alt=""
            className="h-20 w-full rounded-lg object-cover sm:w-28"
          />
        ) : (
          <div
            className={`h-20 w-full rounded-lg bg-gradient-to-br sm:w-28 ${gradientFor(session.title)}`}
          />
        )}
      </Link>
      <div className="flex-1">
        <Link
          to={`/sessions/${session.id}`}
          className="font-semibold text-slate-900 hover:underline"
        >
          {session.title}
        </Link>
        <p className="mt-0.5 text-sm text-slate-500">
          {formatDateTime(session.scheduled_at)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={statusTone}>{booking.status}</Badge>
          <span className="text-xs text-slate-400">
            {formatPrice(session.price, session.is_free)}
          </span>
        </div>
      </div>
      {booking.can_cancel && (
        <Button
          variant="secondary"
          loading={cancel.isPending}
          onClick={() => cancel.mutate(booking.id)}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}

export default function UserDashboard() {
  const { user, becomeCreator } = useAuth();
  const navigate = useNavigate();
  const { data: bookings, isLoading } = useMyBookings();
  const [tab, setTab] = useState<Tab>('bookings');
  const [bookingTab, setBookingTab] = useState<BookingTab>('upcoming');

  const grouped = useMemo(() => {
    const list = bookings ?? [];
    return {
      upcoming: list.filter(
        (b) => b.status !== 'cancelled' && isUpcoming(b.session.scheduled_at)
      ),
      past: list.filter(
        (b) => b.status !== 'cancelled' && !isUpcoming(b.session.scheduled_at)
      ),
      cancelled: list.filter((b) => b.status === 'cancelled'),
    };
  }, [bookings]);

  const stats = {
    total: bookings?.length ?? 0,
    upcoming: grouped.upcoming.length,
    attended: grouped.past.length,
  };

  const tabList = grouped[bookingTab];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Hi, {user?.first_name || 'there'} 👋
          </h1>
          <p className="text-sm text-slate-500">Manage your bookings and profile.</p>
        </div>
        {!user?.is_creator && (
          <Button
            variant="secondary"
            loading={becomeCreator.isPending}
            onClick={() =>
              becomeCreator.mutate(undefined, {
                onSuccess: () => navigate('/creator'),
              })
            }
          >
            <Sparkles size={16} /> Become a Creator
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Ticket} label="Total bookings" value={stats.total} />
        <StatCard icon={CalendarClock} label="Upcoming" value={stats.upcoming} />
        <StatCard icon={CalendarCheck} label="Attended" value={stats.attended} />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {(['bookings', 'profile'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold capitalize transition ${
              tab === t
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t === 'bookings' ? 'My Bookings' : 'My Profile'}
          </button>
        ))}
      </div>

      {tab === 'bookings' ? (
        <>
          <div className="mb-5 flex gap-2">
            {(['upcoming', 'past', 'cancelled'] as BookingTab[]).map((bt) => {
              const icon =
                bt === 'upcoming'
                  ? CalendarClock
                  : bt === 'past'
                    ? CheckCircle2
                    : XCircle;
              const Icon = icon;
              return (
                <button
                  key={bt}
                  onClick={() => setBookingTab(bt)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium capitalize transition ${
                    bookingTab === bt
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon size={14} /> {bt} ({grouped[bt].length})
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Spinner className="text-brand-500" size={28} />
            </div>
          ) : tabList.length > 0 ? (
            <div className="space-y-4">
              {tabList.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Ticket}
              title={`No ${bookingTab} bookings`}
              description="When you book sessions, they’ll show up here."
              action={
                <Link to="/" className="btn-primary">
                  Browse sessions
                </Link>
              }
            />
          )}
        </>
      ) : (
        <ProfileTab />
      )}
    </div>
  );
}

function ProfileTab() {
  const { user, updateProfile, avatarUpload, becomeCreator } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  return (
    <div className="card max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-600">
              {(user?.first_name || user?.email || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900">{user?.email}</p>
            <Badge tone={user?.is_creator ? 'brand' : 'slate'}>
              {user?.role}
            </Badge>
          </div>
          <label className="mt-1 inline-block cursor-pointer text-sm font-medium text-brand-600 hover:underline">
            {avatarUpload.isPending ? 'Uploading…' : 'Change avatar'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && avatarUpload.mutate(e.target.files[0])
              }
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">First name</label>
          <input
            className="input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Last name</label>
          <input
            className="input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="label">Bio</label>
        <textarea
          className="input min-h-[90px]"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell others a little about yourself…"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          loading={updateProfile.isPending}
          onClick={() =>
            updateProfile.mutate({
              first_name: firstName,
              last_name: lastName,
              bio,
            })
          }
        >
          Save changes
        </Button>
        {!user?.is_creator && (
          <Button
            variant="secondary"
            loading={becomeCreator.isPending}
            onClick={() =>
              becomeCreator.mutate(undefined, {
                onSuccess: () => navigate('/creator'),
              })
            }
          >
            <Sparkles size={16} /> Become a Creator
          </Button>
        )}
      </div>
    </div>
  );
}
