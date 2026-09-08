'use client';

import { useState } from 'react';
import { generateTargetPlan } from '@/app/actions';

export default function GeneratePlanForm({
  clientId,
  defaultMonth,
  defaultCount = 12,
}: {
  clientId: string;
  defaultMonth: string; // 'YYYY-MM'
  defaultCount?: number;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    formData.set('client_id', clientId);
    setSubmitting(true);
    await generateTargetPlan(formData);
    setSubmitting(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm">
        Generate a whole plan at once →
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="card space-y-3">
      <div>
        <p className="text-sm font-medium">Generate a whole plan at once</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Creates a blank, editable target for each month in the range — any month that already has a
          target is left untouched.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Starting month</label>
          <input name="start_month" type="month" defaultValue={defaultMonth} required className="input" />
        </div>
        <div>
          <label className="label text-xs">Number of months</label>
          <input name="months_count" type="number" min={1} max={36} defaultValue={defaultCount} className="input" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary text-sm" disabled={submitting}>
          {submitting ? 'Generating…' : 'Generate plan'}
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={() => setOpen(false)} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
