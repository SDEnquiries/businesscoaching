'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { renameBusiness } from '@/app/actions';

export default function EditBusinessName({ businessId, currentName }: { businessId: string; currentName: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const formData = new FormData();
    formData.set('business_id', businessId);
    formData.set('name', name.trim());
    await renameBusiness(formData);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold page-heading">{currentName}</h1>
        <button onClick={() => setEditing(true)} className="text-xs page-link">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input text-xl font-semibold py-1"
        autoFocus
      />
      <button onClick={handleSave} disabled={saving} className="btn-primary text-sm whitespace-nowrap">
        {saving ? '…' : 'Save'}
      </button>
      <button
        onClick={() => {
          setName(currentName);
          setEditing(false);
        }}
        className="text-xs page-subtext hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
