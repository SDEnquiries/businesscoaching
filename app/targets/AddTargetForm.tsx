'use client';

import { useState } from 'react';
import { saveTarget } from '@/app/actions';

export default function AddTargetForm({
  clientId,
  defaultMonth,
  nextMonthNumber,
}: {
  clientId: string;
  defaultMonth: string; // 'YYYY-MM'
  nextMonthNumber: number;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    formData.set('client_id', clientId);
    setSubmitting(true);
    await saveTarget(formData);
    setSubmitting(false);
    (document.getElementById(`add-target-form-${clientId}`) as HTMLFormElement)?.reset();
  }

  return (
    <form id={`add-target-form-${clientId}`} action={handleSubmit} className="card space-y-3">
      <p className="text-sm font-medium">Add a month — Month {nextMonthNumber}</p>
      <div>
        <label className="label text-xs">Month</label>
        <input name="period_month" type="month" defaultValue={defaultMonth} required className="input" />
      </div>
      <input name="title" required placeholder="What's the target? (e.g. Sign 3 new clients)" className="input" />
      <textarea name="description" placeholder="Details (optional)" className="input" rows={2} />
      <div>
        <label className="label text-xs">Focus area (optional)</label>
        <input name="pillar" placeholder="e.g. Sales, Team, Cash flow" className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Target value (optional)</label>
          <input name="target_value" type="number" step="any" className="input" />
        </div>
        <div>
          <label className="label text-xs">Unit (optional)</label>
          <input name="target_unit" placeholder="e.g. £, clients, %" className="input" />
        </div>
      </div>
      <button type="submit" className="btn-primary text-sm" disabled={submitting}>
        {submitting ? 'Saving…' : 'Add target'}
      </button>
    </form>
  );
}
