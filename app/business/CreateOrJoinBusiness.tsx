'use client';

import { useState } from 'react';
import { createBusiness, joinBusiness } from '@/app/actions';

export default function CreateOrJoinBusiness() {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(formData: FormData) {
    setSubmitting(true);
    await createBusiness(formData);
    setSubmitting(false);
  }

  async function handleJoin(formData: FormData) {
    setSubmitting(true);
    await joinBusiness(formData);
    setSubmitting(false);
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('create')}
          className={mode === 'create' ? 'btn-primary text-sm flex-1' : 'btn-secondary text-sm flex-1'}
        >
          Create new
        </button>
        <button
          type="button"
          onClick={() => setMode('join')}
          className={mode === 'join' ? 'btn-primary text-sm flex-1' : 'btn-secondary text-sm flex-1'}
        >
          Join with invite
        </button>
      </div>

      {mode === 'create' ? (
        <form action={handleCreate} className="space-y-3">
          <input name="name" required placeholder="Business name" className="input" />
          <button type="submit" className="btn-primary text-sm" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create business'}
          </button>
        </form>
      ) : (
        <form action={handleJoin} className="space-y-3">
          <input name="token" required placeholder="Paste your invite link's code" className="input" />
          <button type="submit" className="btn-primary text-sm" disabled={submitting}>
            {submitting ? 'Joining…' : 'Join business'}
          </button>
        </form>
      )}
    </div>
  );
}
