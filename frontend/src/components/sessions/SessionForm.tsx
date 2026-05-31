import { useState } from 'react';

import { uploadCoverImage } from '@/api/sessions';
import Button from '@/components/ui/Button';
import { useCategories, useSessionMutations } from '@/hooks/useSessions';
import { toast } from '@/lib/toast';
import type { Session, SessionFormValues } from '@/types';

interface Props {
  initial?: Session;
  onDone: () => void;
}

interface Errors {
  [key: string]: string;
}

/** Convert an ISO string to the value a datetime-local input expects. */
function toLocalInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 3600 * 1000);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function SessionForm({ initial, onDone }: Props) {
  const { data: categories } = useCategories();
  const { create, update } = useSessionMutations();
  const isEdit = Boolean(initial);

  const [values, setValues] = useState<SessionFormValues>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    category: initial?.category?.id ?? null,
    cover_image: initial?.cover_image ?? null,
    price: initial?.price ?? '0.00',
    capacity: initial?.capacity ?? 10,
    scheduled_at: toLocalInput(initial?.scheduled_at),
    duration_minutes: initial?.duration_minutes ?? 60,
    tags: initial?.tags ?? '',
    status: initial?.status ?? 'draft',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof SessionFormValues>(
    key: K,
    value: SessionFormValues[K]
  ) => setValues((v) => ({ ...v, [key]: value }));

  const validate = (): boolean => {
    const e: Errors = {};
    if (!values.title.trim()) e.title = 'Title is required.';
    if (!values.description.trim()) e.description = 'Description is required.';
    if (new Date(values.scheduled_at).getTime() <= Date.now())
      e.scheduled_at = 'Date must be in the future.';
    if (values.capacity < 1 || values.capacity > 1000)
      e.capacity = 'Capacity must be between 1 and 1000.';
    if (Number(values.price) < 0) e.price = 'Price cannot be negative.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCover = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadCoverImage(file);
      set('cover_image', url);
      toast.success('Cover image uploaded.');
    } catch {
      toast.error('Image upload failed (is MinIO running?).');
    } finally {
      setUploading(false);
    }
  };

  const submit = (publish: boolean) => {
    if (!validate()) return;
    const payload: Partial<SessionFormValues> = {
      ...values,
      scheduled_at: new Date(values.scheduled_at).toISOString(),
      status: publish ? 'published' : values.status === 'published' ? 'published' : 'draft',
      category: values.category,
    };

    if (isEdit && initial) {
      update.mutate({ id: initial.id, payload }, { onSuccess: onDone });
    } else {
      create.mutate(payload, { onSuccess: onDone });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label className="label">Title</label>
        <input
          className="input"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Morning Vinyasa Flow"
        />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[100px]"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What can attendees expect?"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={values.category ?? ''}
            onChange={(e) =>
              set('category', e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">None</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date & time</label>
          <input
            type="datetime-local"
            className="input"
            value={values.scheduled_at}
            onChange={(e) => set('scheduled_at', e.target.value)}
          />
          {errors.scheduled_at && (
            <p className="mt-1 text-xs text-red-600">{errors.scheduled_at}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Duration (min)</label>
          <input
            type="number"
            min={5}
            className="input"
            value={values.duration_minutes}
            onChange={(e) => set('duration_minutes', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Capacity</label>
          <input
            type="number"
            min={1}
            className="input"
            value={values.capacity}
            onChange={(e) => set('capacity', Number(e.target.value))}
          />
          {errors.capacity && (
            <p className="mt-1 text-xs text-red-600">{errors.capacity}</p>
          )}
        </div>
        <div>
          <label className="label">Price ($)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            className="input"
            value={values.price}
            onChange={(e) => set('price', e.target.value)}
          />
          {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
        </div>
      </div>
      <p className="-mt-2 text-xs text-slate-400">
        Set price to 0 to mark the session as free.
      </p>

      <div>
        <label className="label">Tags (comma-separated)</label>
        <input
          className="input"
          value={values.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="yoga, morning, beginner"
        />
        {values.tags && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {values.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700"
                >
                  {t}
                </span>
              ))}
          </div>
        )}
      </div>

      <div>
        <label className="label">Cover image</label>
        <div className="flex items-center gap-3">
          {values.cover_image && (
            <img
              src={values.cover_image}
              alt=""
              className="h-12 w-20 rounded-lg object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            className="text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
            onChange={(e) => e.target.files?.[0] && handleCover(e.target.files[0])}
          />
          {uploading && <span className="text-xs text-slate-400">Uploading…</span>}
        </div>
      </div>

      <div className="flex gap-3 border-t border-slate-100 pt-4">
        <Button
          variant="secondary"
          fullWidth
          loading={pending}
          onClick={() => submit(false)}
        >
          Save as draft
        </Button>
        <Button fullWidth loading={pending} onClick={() => submit(true)}>
          {isEdit ? 'Save & publish' : 'Publish'}
        </Button>
      </div>
    </form>
  );
}
