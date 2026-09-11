'use client';

import { useState } from 'react';
import { updateBusinessInfo } from '@/app/actions';

export default function BusinessInfoForm({
  clientId,
  initialValue,
  lastUpdatedLabel,
}: {
  clientId: string;
  initialValue: string;
  lastUpdatedLabel?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [editing, setEditing] = useState(!initialValue);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    formData.set('client_id', clientId);
    setSaving(true);
    await updateBusinessInfo(formData);
    setSaving(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="card">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-xs text-gray-400">{lastUpdatedLabel}</p>
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-brand-600 hover:underline">
            Edit
          </button>
        </div>
        <p className="text-gray-700 text-sm whitespace-pre-wrap">{value}</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="card space-y-3">
      <label className="label text-xs">About the business &amp; how they want it to grow</label>
      <textarea
        name="business_info"
        className="input"
        rows={6}
        placeholder="What does the business do, where is it now, and what does the owner want it to become?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex gap-2">
        <button type="submit" className="btn-primary text-sm" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {initialValue && (
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => {
              setValue(initialValue);
              setEditing(false);
            }}
            disabled={saving}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
