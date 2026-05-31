import { ChevronLeft, ChevronRight, SearchX, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import SessionCard from '@/components/sessions/SessionCard';
import SessionFilters from '@/components/sessions/SessionFilters';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/SkeletonCard';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import type { SessionFilters as Filters } from '@/types';

const PAGE_SIZE = 12;

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<Filters>({ page: 1 });
  const [searchInput, setSearchInput] = useState('');

  // Debounce the search input (300ms) into the active filter set.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, isFetching } = useSessions(filters);

  const update = (next: Partial<Filters>) => setFilters((f) => ({ ...f, ...next }));

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1),
    [data]
  );
  const page = filters.page ?? 1;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-sky-600">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center text-white sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles size={14} /> Spiritual wellness, on your schedule
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Discover & book transformative sessions
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-brand-50/90">
            Yoga, meditation, breathwork, sound healing and more — led by trusted
            creators around the world.
          </p>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="btn mt-7 bg-white px-6 py-2.5 text-brand-700 hover:bg-brand-50"
            >
              Get started — it’s free
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <SessionFilters
          filters={filters}
          onChange={update}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
        />

        {isLoading ? (
          <SkeletonGrid count={6} />
        ) : isError ? (
          <EmptyState
            icon={SearchX}
            title="Couldn’t load sessions"
            description="Something went wrong reaching the server. Please try again."
          />
        ) : data && data.results.length > 0 ? (
          <>
            <div
              className={`grid grid-cols-1 gap-6 transition sm:grid-cols-2 lg:grid-cols-3 ${
                isFetching ? 'opacity-60' : ''
              }`}
            >
              {data.results.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => update({ page: page - 1 })}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <span className="px-3 text-sm font-medium text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => update({ page: page + 1 })}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            title="No sessions found"
            description="Try adjusting your search or filters to find what you’re looking for."
          />
        )}
      </div>
    </div>
  );
}
