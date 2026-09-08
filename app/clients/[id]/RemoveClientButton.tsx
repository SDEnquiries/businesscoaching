'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeClient } from '@/app/actions';

export default function RemoveClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    const formData = new FormData();
    formData.set('client_id', clientId);
    await removeClient(formData);
    router.push('/dashboard');
    router.refresh();
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-xs text-red-500 hover:underline">
        Remove from my roster
      </button>
    );
  }

  return (
    <div className="text-xs">
      <span className="text-gray-600">
        Remove {clientName}? They'll move to the shared archive with their account and data
        intact — any coach can pull them back in later.{' '}
      </span>
      <button onClick={handleRemove} disabled={removing} className="text-red-600 font-medium hover:underline mr-2">
        {removing ? 'Removing…' : 'Confirm'}
      </button>
      <button onClick={() => setConfirming(false)} className="text-gray-500 hover:underline">
        Cancel
      </button>
    </div>
  );
}
