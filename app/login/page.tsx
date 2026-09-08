'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <Logo size={72} textSize="lg" align="center" />
        </div>
        <h1 className="text-xl font-semibold mb-6 text-center">Log in</h1>

        <label className="label">Email</label>
        <input
          className="input mb-4"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="label">Password</label>
        <input
          className="input mb-4"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        <p className="text-sm text-gray-600 mt-4 text-center">
          No account?{' '}
          <Link href="/signup" className="text-brand-600 font-medium">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
