'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateAvatarOnly } from '@/app/actions';

export default function QuickAvatarUpload({
  currentUrl,
  fallbackLetter,
}: {
  currentUrl: string | null;
  fallbackLetter: string;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.set('avatar', file);
    await updateAvatarOnly(formData);
    setUploading(false);
    router.refresh();
  }

  return (
    <label className="relative cursor-pointer group block w-20 h-20">
      <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-medium overflow-hidden border-2 border-white shadow">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          fallbackLetter
        )}
      </div>
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs text-center px-1">
        {uploading ? '…' : 'Change photo'}
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </label>
  );
}
