'use client';

import { useState } from 'react';
import { addResource } from '@/app/actions';

export default function ResourceForm({ clients }: { clients: { id: string; full_name: string }[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState('link');

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    formData.set('resource_type', type);
    await addResource(formData);
    setSubmitting(false);
    (document.getElementById('resource-form') as HTMLFormElement)?.reset();
  }

  return (
    <form id="resource-form" action={handleSubmit} className="space-y-3">
      <input name="title" required placeholder="Title" className="input" />
      <textarea name="description" placeholder="Description (optional)" className="input" rows={2} />

      <div className="flex gap-2">
        {(['link', 'video', 'file'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={type === t ? 'btn-primary text-sm flex-1 capitalize' : 'btn-secondary text-sm flex-1 capitalize'}
          >
            {t}
          </button>
        ))}
      </div>

      {type === 'file' ? (
        <input name="file" type="file" className="text-sm" />
      ) : (
        <input name="url" type="url" placeholder="https://..." className="input" />
      )}

      <div>
        <label className="label text-xs">Share with</label>
        <select name="client_id" className="input">
            <option value="">All coachees</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} only
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-primary text-sm" disabled={submitting}>
        {submitting ? 'Sharing…' : 'Share resource'}
      </button>
    </form>
  );
}
