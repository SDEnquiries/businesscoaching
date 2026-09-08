'use client';

import { useState } from 'react';
import { addProgressEntry } from '@/app/actions';

export default function ProgressForm() {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    await addProgressEntry(formData);
    setSubmitting(false);
    (document.getElementById('progress-form') as HTMLFormElement)?.reset();
  }

  return (
    <form id="progress-form" action={handleSubmit} className="space-y-3">
      <input name="title" className="input" placeholder="Title (optional)" />
      <textarea
        name="journal_text"
        className="input"
        rows={3}
        placeholder="What's changed or developed since last time?"
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Mood (1–10)</label>
          <input name="mood_rating" type="number" min={1} max={10} className="input" />
        </div>
        <div>
          <label className="label text-xs">Energy (1–10)</label>
          <input name="energy" type="number" min={1} max={10} className="input" />
        </div>
      </div>
      <div>
        <label className="label text-xs">Photo (optional)</label>
        <input name="photo" type="file" accept="image/*" className="text-sm" />
      </div>
      <button type="submit" className="btn-primary text-sm" disabled={submitting}>
        {submitting ? 'Saving…' : 'Add entry'}
      </button>
    </form>
  );
}
