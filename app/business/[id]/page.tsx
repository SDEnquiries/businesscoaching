import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import InviteCoachForm from './InviteCoachForm';
import LeaveBusinessButton from './LeaveBusinessButton';
import EditBusinessName from './EditBusinessName';

export default async function BusinessDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'coach') redirect('/dashboard');

  // Confirm membership
  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('business_id', params.id)
    .eq('coach_id', user.id)
    .single();
  if (!membership) redirect('/business');

  const { data: business } = await supabase.from('businesses').select('*').eq('id', params.id).single();

  const { data: memberRows } = await supabase
    .from('business_members')
    .select('coach_id, profiles(id, full_name, avatar_url)')
    .eq('business_id', params.id);

  const coaches = (memberRows ?? []).map((m: any) => m.profiles).filter(Boolean);
  const coachIds = coaches.map((c: any) => c.id);

  const { data: rawClients } = await supabase
    .from('profiles')
    .select('id, coach_id, business_id, full_name, avatar_url')
    .in('coach_id', coachIds.length > 0 ? coachIds : ['00000000-0000-0000-0000-000000000000'])
    .order('full_name');

  // Only include a coachee here if they're pinned to THIS business,
  // or unpinned (in which case they're inherited from their coach).
  const clients = (rawClients ?? []).filter((c) => c.business_id === null || c.business_id === params.id);

  const coacheeCounts: Record<string, number> = {};
  clients.forEach((c) => {
    if (c.coach_id) coacheeCounts[c.coach_id] = (coacheeCounts[c.coach_id] ?? 0) + 1;
  });

  const clientIds = clients.map((c) => c.id);

  const { data: homeworkAll } = await supabase
    .from('homework')
    .select('status')
    .in('client_id', clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000']);

  const { data: entriesAll } = await supabase
    .from('progress_entries')
    .select('mood_rating')
    .in('client_id', clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000']);

  const totalHomework = homeworkAll?.length ?? 0;
  const completedHomework = homeworkAll?.filter((h) => h.status !== 'assigned').length ?? 0;
  const moodValues = (entriesAll ?? []).filter((e) => e.mood_rating).map((e) => e.mood_rating as number);
  const avgMood = moodValues.length > 0 ? (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1) : null;

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/business" className="text-xs text-brand-600 hover:underline">
              ← All businesses
            </Link>
            <EditBusinessName businessId={params.id} currentName={business?.name ?? ''} />
          </div>
          <LeaveBusinessButton businessId={params.id} />
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-3">Business overview report</h2>
          <div className="card grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-brand-600">{coaches.length}</p>
              <p className="text-xs text-gray-500">Coaches</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-brand-600">{clients?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Coachees</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-brand-600">
                {completedHomework}/{totalHomework}
              </p>
              <p className="text-xs text-gray-500">Homework completed</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-brand-600">{avgMood ?? '—'}</p>
              <p className="text-xs text-gray-500">Avg. mood /10</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Team</h2>
          <div className="grid gap-2 mb-4">
            {coaches.map((c: any) => (
              <Link
                key={c.id}
                href={`/business/${params.id}/coach/${c.id}`}
                className="card py-3 flex items-center justify-between hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-medium overflow-hidden">
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      c.full_name?.[0]?.toUpperCase() ?? '?'
                    )}
                  </div>
                  <span>{c.full_name}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {coacheeCounts[c.id] ?? 0} coachee{coacheeCounts[c.id] === 1 ? '' : 's'}
                </span>
              </Link>
            ))}
          </div>
          <div className="card">
            <h3 className="font-medium mb-3">Invite a coach to join</h3>
            <InviteCoachForm businessId={params.id} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Full roster</h2>
          <div className="grid gap-4">
            {coaches.map((coach: any) => {
              const theirClients = (clients ?? []).filter((c) => c.coach_id === coach.id);
              return (
                <div key={coach.id} className="card">
                  <p className="font-medium text-sm text-gray-700 mb-2">{coach.full_name}</p>
                  {theirClients.length > 0 ? (
                    <div className="grid gap-1">
                      {theirClients.map((c: any) => (
                        <Link
                          key={c.id}
                          href={`/clients/${c.id}`}
                          className="flex items-center gap-2 text-sm hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
                        >
                          <span className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-medium overflow-hidden">
                            {c.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              c.full_name?.[0]?.toUpperCase() ?? '?'
                            )}
                          </span>
                          {c.full_name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No coachees assigned</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
