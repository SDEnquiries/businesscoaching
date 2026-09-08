'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { assignClientToCoach } from '@/app/actions';

export default function AssignToCoach({
  clientId,
  coaches,
  defaultCoachId,
  buttonLabel = 'Assign',
}: {
  clientId: string;
  coaches: { id: string; full_name: string }[];
  defaultCoachId?: string;
  buttonLabel?: string;
}) {
  const router = useRouter();
  const [coachId, setCoachId] = useState(defaultCoachId ?? coaches[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!coachId) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.set('client_id', clientId);
    formData.set('coach_id', coachId);
    await assignClientToCoach(formData);
    setSubmitting(false);
    router.refresh();
  }

  if (coaches.length === 0) return null;

  return (
    <div className="flex gap-2 items-center">
      <select value={coachId} onChange={(e) => setCoachId(e.target.value)} className="input text-sm py-1.5">
        {coaches.map((c) => (
          <option key={c.id} value={c.id}>
            {c.full_name}
          </option>
        ))}
      </select>
      <button onClick={handleSubmit} disabled={submitting} className="btn-secondary text-sm whitespace-nowrap">
        {submitting ? '…' : buttonLabel}
      </button>
    </div>
  );
}
