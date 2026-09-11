import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import AssignToCoach from '@/components/AssignToCoach';

export default async function ArchivePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'coach') redirect('/dashboard');

  const { data: archived } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio')
    .eq('role', 'client')
    .is('coach_id', null)
    .order('full_name');

  // Everyone you can assign to: yourself + any teammate across your businesses
  const { data: memberships } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('coach_id', user.id);

  const businessIds = (memberships ?? []).map((m) => m.business_id);

  const { data: teammateRows } = await supabase
    .from('business_members')
    .select('profiles(id, full_name)')
    .in('business_id', businessIds.length > 0 ? businessIds : ['00000000-0000-0000-0000-000000000000']);

  const teammateMap = new Map<string, { id: string; full_name: string }>();
  teammateMap.set(profile.id, { id: profile.id, full_name: `${profile.full_name} (you)` });
  (teammateRows ?? []).forEach((r: any) => {
    if (r.profiles) teammateMap.set(r.profiles.id, r.profiles.id === profile.id ? teammateMap.get(profile.id)! : r.profiles);
  });
  const assignableCoaches = Array.from(teammateMap.values());

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold page-heading">Archive</h1>
          <p className="page-subtext text-sm mt-1">
            Coachees who've been removed from a roster. Any coach can assign someone from here
            to themselves or a teammate.
          </p>
        </div>

        <div className="grid gap-3">
          {archived && archived.length > 0 ? (
            archived.map((c) => (
              <div key={c.id} className="card flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-medium overflow-hidden">
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      c.full_name?.[0]?.toUpperCase() ?? '?'
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{c.full_name}</p>
                    {c.bio && <p className="text-xs text-gray-500 line-clamp-1">{c.bio}</p>}
                  </div>
                </div>
                <AssignToCoach clientId={c.id} coaches={assignableCoaches} defaultCoachId={profile.id} />
              </div>
            ))
          ) : (
            <p className="page-subtext">Nothing in the archive right now.</p>
          )}
        </div>
      </div>
    </main>
  );
}
