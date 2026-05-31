import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

import { type ToastType, useToastStore } from '@/lib/toast';

const config: Record<ToastType, { icon: typeof Info; ring: string; text: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', text: 'text-emerald-600' },
  error: { icon: XCircle, ring: 'border-red-200', text: 'text-red-600' },
  info: { icon: Info, ring: 'border-sky-200', text: 'text-sky-600' },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
      {toasts.map((t) => {
        const { icon: Icon, ring, text } = config[t.type];
        return (
          <div
            key={t.id}
            className={`animate-slide-in flex items-start gap-3 rounded-xl border ${ring} bg-white p-3 shadow-lg`}
          >
            <Icon className={`mt-0.5 shrink-0 ${text}`} size={18} />
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
