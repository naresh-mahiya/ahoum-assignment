import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-sky-500 text-white">
            <Sparkles size={15} />
          </span>
          <span className="font-bold">Ahoum</span>
          <span className="text-sm text-slate-400">· Sessions Marketplace</span>
        </div>
        <p className="text-sm text-slate-400">
          Built with Django REST + React · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
