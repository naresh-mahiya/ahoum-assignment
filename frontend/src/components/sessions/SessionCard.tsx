import { Calendar, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import Badge from '@/components/ui/Badge';
import {
  formatDateTime,
  formatDuration,
  formatPrice,
  gradientFor,
} from '@/lib/format';
import type { Session } from '@/types';

export default function SessionCard({ session }: { session: Session }) {
  const seatsLeft = session.available_spots;
  const lowSeats = seatsLeft > 0 && seatsLeft < 3;
  const creatorName =
    `${session.creator.first_name} ${session.creator.last_name}`.trim() ||
    session.creator.email;

  return (
    <Link
      to={`/sessions/${session.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-44 overflow-hidden">
        {session.cover_image ? (
          <img
            src={session.cover_image}
            alt={session.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${gradientFor(session.title)}`}
          />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {session.category && <Badge tone="brand">{session.category.name}</Badge>}
        </div>
        <div className="absolute right-3 top-3">
          {session.is_free ? (
            <Badge tone="green">Free</Badge>
          ) : (
            <Badge tone="blue">{formatPrice(session.price, false)}</Badge>
          )}
        </div>
        {session.is_fully_booked && (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/55">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-slate-800">
              Fully Booked
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-bold text-slate-900">
          {session.title}
        </h3>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          {session.creator.avatar ? (
            <img
              src={session.creator.avatar}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <span className="h-5 w-5 rounded-full bg-slate-200" />
          )}
          <span className="line-clamp-1">{creatorName}</span>
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            {formatDateTime(session.scheduled_at)}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            {formatDuration(session.duration_minutes)}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4">
          <span
            className={`flex items-center gap-1 text-xs font-semibold ${
              lowSeats ? 'text-red-600' : 'text-slate-500'
            }`}
          >
            <Users size={14} />
            {session.is_fully_booked
              ? 'No seats left'
              : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}
          </span>
          <span className="text-xs font-semibold text-brand-600 group-hover:underline">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}
