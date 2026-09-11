import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';

export default async function TeammateRosterPage({
  params,
}: {
  params: { id: string; coachId: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'coach') redirect('/dashboard');

  // Confirm membership in this business
  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('business_id', params.id)
    .eq('coach_id', user.id)
    .single();
  if (!membership) redirect('/business');

  const { data: teammate } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', params.coachId)
    .single();

  const { data: rawClients } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, business_id')
    .eq('coach_id', params.coachId)
    .order('full_name');

  const clients = (rawClients ?? []).filter((c) => c.business_id === null || c.business_id === params.id);

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Link href={`/business/${params.id}`} className="text-xs page-link">
          ← Back to team
        </Link>
        <h1 className="text-2xl font-semibold page-heading">{teammate?.full_name}'s coachees</h1>

        <div className="grid gap-3">
          {clients && clients.length > 0 ? (
            clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="card flex items-center gap-4 hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-medium overflow-hidden">
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    c.full_name?.[0]?.toUpperCase() ?? '?'
                  )}
                </div>
                <span className="font-medium">{c.full_name}</span>
              </Link>
            ))
          ) : (
            <p className="page-subtext">No coachees yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
