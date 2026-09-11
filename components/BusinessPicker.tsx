'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setClientBusiness } from '@/app/actions';

export default function BusinessPicker({
  clientId,
  businesses,
  currentBusinessId,
}: {
  clientId: string;
  businesses: { id: string; name: string }[];
  currentBusinessId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState(currentBusinessId ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const formData = new FormData();
    formData.set('client_id', clientId);
    formData.set('business_id', businessId);
    await setClientBusiness(formData);
    setSubmitting(false);
    setOpen(false);
    router.refresh();
  }

  if (businesses.length === 0) return null;

  const currentName = businesses.find((b) => b.id === currentBusinessId)?.name;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs page-link whitespace-nowrap">
        Swap business{currentName ? ` (currently ${currentName})` : ''}
      </button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="input text-sm py-1.5">
        <option value="">Auto (all my businesses)</option>
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm whitespace-nowrap">
        {submitting ? '…' : 'Confirm'}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs page-subtext hover:underline">
        Cancel
      </button>
    </div>
  );
}

