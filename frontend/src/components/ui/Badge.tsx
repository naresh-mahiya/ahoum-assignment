import type { ReactNode } from 'react';

type Tone = 'brand' | 'green' | 'red' | 'amber' | 'slate' | 'blue';

const toneClass: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-sky-100 text-sky-700',
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export default function Badge({ children, tone = 'slate', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
