import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Tag,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import BookingModal from '@/components/sessions/BookingModal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useMyBookings } from '@/hooks/useBookings';
import {
  formatDateTime,
  formatDuration,
  formatPrice,
  gradientFor,
  isUpcoming,
} from '@/lib/format';
import { useSession } from '@/hooks/useSessions';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: session, isLoading, isError } = useSession(id);
  const { data: myBookings } = useMyBookings();
  const [bookingOpen, setBookingOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="text-brand-500" size={32} />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Session not found</h1>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Back to catalog
        </Link>
      </div>
    );
  }

  const existingBooking = myBookings?.find(
    (b) => b.session.id === session.id && b.status !== 'cancelled'
  );
  const isOwnSession = user?.id === session.creator.id;
  const seatsLeft = session.available_spots;
  const seatsPct = Math.round(
    ((session.capacity - seatsLeft) / Math.max(session.capacity, 1)) * 100
  );
  const tags = session.tags
    ? session.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  const upcoming = isUpcoming(session.scheduled_at);
  const creatorName =
    `${session.creator.first_name} ${session.creator.last_name}`.trim() ||
    session.creator.email;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left column */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="relative h-64 sm:h-80">
              {session.cover_image ? (
                <img
                  src={session.cover_image}
                  alt={session.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className={`h-full w-full bg-gradient-to-br ${gradientFor(session.title)}`}
                />
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {session.category && <Badge tone="brand">{session.category.name}</Badge>}
            {session.is_free ? (
              <Badge tone="green">Free</Badge>
            ) : (
              <Badge tone="blue">{formatPrice(session.price, false)}</Badge>
            )}
            {!upcoming && <Badge tone="slate">Past session</Badge>}
          </div>

          <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
            {session.title}
          </h1>

          {/* Creator card */}
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            {session.creator.avatar ? (
              <img
                src={session.creator.avatar}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 font-bold text-brand-600">
                {creatorName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Hosted by
              </p>
              <p className="font-semibold text-slate-800">{creatorName}</p>
              {session.creator.bio && (
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                  {session.creator.bio}
                </p>
              )}
            </div>
          </div>

          <div className="prose mt-6 max-w-none">
            <h2 className="text-lg font-bold text-slate-900">About this session</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600">
              {session.description}
            </p>
          </div>

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Tag size={16} className="text-slate-400" />
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right column (sticky booking card) */}
        <div className="lg:col-span-2">
          <div className="card sticky top-20 space-y-4 p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-700">
                <Calendar size={18} className="text-brand-500" />
                <div>
                  <p className="text-xs text-slate-400">When</p>
                  <p className="font-medium">{formatDateTime(session.scheduled_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Clock size={18} className="text-brand-500" />
                <div>
                  <p className="text-xs text-slate-400">Duration</p>
                  <p className="font-medium">
                    {formatDuration(session.duration_minutes)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-slate-500">
                  <Users size={14} /> Seats
                </span>
                <span
                  className={`font-semibold ${
                    seatsLeft < 3 && seatsLeft > 0 ? 'text-red-600' : 'text-slate-700'
                  }`}
                >
                  {seatsLeft} / {session.capacity} left
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${seatsPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-baseline justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Price</span>
              <span className="text-2xl font-extrabold text-slate-900">
                {formatPrice(session.price, session.is_free)}
              </span>
            </div>

            {/* Booking CTA logic */}
            {isOwnSession ? (
              <p className="rounded-lg bg-slate-50 p-3 text-center text-sm text-slate-500">
                This is your session.
              </p>
            ) : existingBooking ? (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={18} /> You’re booked
              </div>
            ) : !upcoming ? (
              <Button fullWidth disabled>
                Session has ended
              </Button>
            ) : session.is_fully_booked ? (
              <Button fullWidth disabled>
                Fully booked
              </Button>
            ) : !isAuthenticated ? (
              <Button
                fullWidth
                onClick={() =>
                  navigate('/login', {
                    state: { returnUrl: `/sessions/${session.id}` },
                  })
                }
              >
                Log in to book
              </Button>
            ) : (
              <Button fullWidth onClick={() => setBookingOpen(true)}>
                Book now
              </Button>
            )}
          </div>
        </div>
      </div>

      <BookingModal
        session={session}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </div>
  );
}
