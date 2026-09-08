'use client';

import { useState } from 'react';

export default function DeleteButton({
  action,
  fields,
  label = 'Delete',
  confirmText = 'Delete this?',
  onDeleted,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label?: string;
  confirmText?: string;
  onDeleted?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
    await action(formData);
    setDeleting(false);
    setConfirming(false);
    onDeleted?.();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-red-500 hover:underline"
      >
        {label}
      </button>
    );
  }

  return (
    <span className="text-xs inline-flex items-center gap-2">
      <span className="text-gray-600">{confirmText}</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-red-600 font-medium hover:underline"
      >
        {deleting ? 'Deleting…' : 'Confirm'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-gray-500 hover:underline"
      >
        Cancel
      </button>
    </span>
  );
}
