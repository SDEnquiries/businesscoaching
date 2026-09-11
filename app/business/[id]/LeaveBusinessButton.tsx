'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { leaveBusiness } from '@/app/actions';

export default function LeaveBusinessButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function handleLeave() {
    setLeaving(true);
    const formData = new FormData();
    formData.set('business_id', businessId);
    await leaveBusiness(formData);
    router.push('/business');
    router.refresh();
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-xs text-red-300 hover:underline whitespace-nowrap">
        Leave this business
      </button>
    );
  }

  return (
    <div className="text-xs text-right">
      <p className="page-subtext mb-1">Leave this business?</p>
      <button onClick={handleLeave} disabled={leaving} className="text-red-400 font-medium hover:underline mr-2">
        {leaving ? 'Leaving…' : 'Confirm'}
      </button>
      <button onClick={() => setConfirming(false)} className="page-subtext hover:underline">
        Cancel
      </button>
    </div>
  );
}
