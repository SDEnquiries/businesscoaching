import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import CreateOrJoinBusiness from './CreateOrJoinBusiness';

export default async function BusinessHubPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'coach') redirect('/dashboard');

  const { data: memberships } = await supabase
    .from('business_members')
    .select('business_id, businesses(id, name)')
    .eq('coach_id', user.id);

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Your businesses</h1>

        {memberships && memberships.length > 0 ? (
          <div className="grid gap-3">
            {memberships.map((m: any) => (
              <Link key={m.business_id} href={`/business/${m.business_id}`} className="card hover:shadow-md transition block">
                <p className="font-medium">{m.businesses?.name}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">You're not part of any business yet.</p>
        )}

        <div className="card">
          <h2 className="font-medium mb-3">Create or join another</h2>
          <CreateOrJoinBusiness />
        </div>
      </div>
    </main>
  );
}
