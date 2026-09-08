'use client';

import { useState } from 'react';
import { inviteCoachToBusiness } from '@/app/actions';

export default function InviteCoachForm({ businessId }: { businessId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.set('business_id', businessId);
    const t = await inviteCoachToBusiness(formData);
    setToken(t);
    setLoading(false);
  }

  return (
    <div>
      <form action={handleSubmit} className="flex gap-2">
        <input name="email" type="email" required placeholder="coach@example.com" className="input" />
        <button type="submit" className="btn-primary whitespace-nowrap" disabled={loading}>
          {loading ? 'Creating…' : 'Invite'}
        </button>
      </form>
      {token && (
        <p className="text-sm text-gray-600 mt-3">
          Send this coach their invite code to paste into their "Join with invite" screen:{' '}
          <span className="text-brand-600 font-mono break-all">{token}</span>
        </p>
      )}
    </div>
  );
}
