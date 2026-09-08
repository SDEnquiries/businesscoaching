'use client';

import { useState } from 'react';
import { createInvite } from '@/app/actions';

export default function InviteForm() {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const token = await createInvite(formData);
    setLink(`${window.location.origin}/signup?invite=${token}`);
    setLoading(false);
  }

  return (
    <div>
      <form action={handleSubmit} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="coachee@example.com"
          className="input"
        />
        <button type="submit" className="btn-primary whitespace-nowrap" disabled={loading}>
          {loading ? 'Creating…' : 'Create invite'}
        </button>
      </form>
      {link && (
        <p className="text-sm text-gray-600 mt-3">
          Send this link to your client:{' '}
          <span className="text-brand-600 break-all">{link}</span>
        </p>
      )}
    </div>
  );
}
