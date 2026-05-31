import { Search, SlidersHorizontal } from 'lucide-react';

import { useCategories } from '@/hooks/useSessions';
import type { SessionFilters as Filters } from '@/types';

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function SessionFilters({
  filters,
  onChange,
  searchValue,
  onSearchChange,
}: Props) {
  const { data: categories } = useCategories();

  return (
    <div className="card mb-8 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          placeholder="Search sessions, tags, or creators…"
          className="input pl-10"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1 text-slate-400 sm:flex">
          <SlidersHorizontal size={16} />
        </div>
        <select
          className="input w-auto"
          value={filters.category || ''}
          onChange={(e) => onChange({ category: e.target.value || undefined, page: 1 })}
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
            checked={!!filters.is_free}
            onChange={(e) => onChange({ is_free: e.target.checked || undefined, page: 1 })}
          />
          Free
        </label>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
            checked={!!filters.available_only}
            onChange={(e) =>
              onChange({ available_only: e.target.checked || undefined, page: 1 })
            }
          />
          Available
        </label>
      </div>
    </div>
  );
}
