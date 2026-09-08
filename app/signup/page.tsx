'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';

type Coach = { id: string; full_name: string };

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const supabase = createClient();

  const [role, setRole] = useState<'coach' | 'client'>('client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role !== 'client' || inviteToken) return;
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'coach')
      .then(({ data }) => setCoaches(data ?? []));
  }, [role, inviteToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let coachId: string | null = null;

    // If joining via an invite link, resolve the coach from the invite token
    if (role === 'client' && inviteToken) {
      const { data: invite } = await supabase
        .from('invites')
        .select('coach_id, status')
        .eq('token', inviteToken)
        .single();
      if (!invite || invite.status !== 'pending') {
        setError('This invite link is invalid or has already been used.');
        setLoading(false);
        return;
      }
      coachId = invite.coach_id;
    } else if (role === 'client') {
      coachId = selectedCoach || null;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? 'Could not create account.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      role,
      full_name: fullName,
      coach_id: coachId,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    if (role === 'client' && inviteToken) {
      await supabase.from('invites').update({ status: 'claimed' }).eq('token', inviteToken);
    }

    setLoading(false);
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <Logo size={72} textSize="lg" align="center" />
        </div>
        <h1 className="text-xl font-semibold mb-6 text-center">Create an account</h1>

        {!inviteToken && (
          <>
            <label className="label">I am a…</label>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={role === 'client' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
              >
                Coachee
              </button>
              <button
                type="button"
                onClick={() => setRole('coach')}
                className={role === 'coach' ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
              >
                Coach
              </button>
            </div>
          </>
        )}

        <label className="label">Full name</label>
        <input
          className="input mb-4"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

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
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {role === 'client' && !inviteToken && (
          <>
            <label className="label">Choose your coach</label>
            <select
              className="input mb-4"
              value={selectedCoach}
              onChange={(e) => setSelectedCoach(e.target.value)}
            >
              <option value="">Select later / not sure</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </>
        )}

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 font-medium">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
