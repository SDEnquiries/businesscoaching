'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NavBar({ name, role }: { name: string; role?: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src="/logo.png" alt="Switch Direction" width={36} height={36} className="object-contain" />
        <span className="font-semibold text-brand-700 hidden sm:inline">Switch Direction</span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600 hidden md:inline">Hi, {name}</span>
        <Link href="/dashboard" className="text-brand-600 hover:underline">
          Dashboard
        </Link>
        <Link href="/resources" className="text-brand-600 hover:underline">
          Resources
        </Link>
        {role === 'coach' && (
          <Link href="/business" className="text-brand-600 hover:underline">
            Business
          </Link>
        )}
        {role === 'coach' && (
          <Link href="/archive" className="text-brand-600 hover:underline hidden sm:inline">
            Archive
          </Link>
        )}
        <Link href="/profile" className="text-brand-600 hover:underline">
          Profile
        </Link>
        <button onClick={handleLogout} className="text-gray-500 hover:text-gray-800">
          Log out
        </button>
      </div>
    </nav>
  );
}
