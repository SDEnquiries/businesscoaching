'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/app/actions';

export default function ProfileForm({ profile }: { profile: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<string | null>(profile.avatar_url);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setSaved(false);
    await updateProfile(formData);
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center text-brand-700 font-medium text-xl">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            profile.full_name?.[0]?.toUpperCase()
          )}
        </div>
        <div>
          <label className="label text-xs">Profile photo</label>
          <input
            name="avatar"
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setPreview(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
        </div>
      </div>

      <div>
        <label className="label">Full name</label>
        <input name="full_name" defaultValue={profile.full_name} className="input" required />
      </div>

      <div>
        <label className="label">Bio</label>
        <textarea name="bio" defaultValue={profile.bio} className="input" rows={3} />
      </div>

      <p className="text-xs text-gray-500">
        Role: <span className="font-medium">{profile.role === 'client' ? 'Coachee' : 'Coach'}</span>
      </p>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      {saved && <span className="text-green-600 text-sm ml-3">Saved ✓</span>}
    </form>
  );
}
