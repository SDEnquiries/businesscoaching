import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import InviteForm from './InviteForm';

export default async function CoachDashboard({ profile }: { profile: any }) {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('coach_id', profile.id)
    .order('full_name');

  const clientIds = (clients ?? []).map((c) => c.id);

  const { data: targetsAll } = await supabase
    .from('targets')
    .select('status')
    .in('client_id', clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000']);

  const achievedTargets = targetsAll?.filter((t) => t.status === 'achieved').length ?? 0;
  const totalTargets = targetsAll?.length ?? 0;

  const { count: resourceCount } = await supabase
    .from('resources')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', profile.id);

  // Businesses this coach belongs to, with team + coachee counts for each
  const { data: memberships } = await supabase
    .from('business_members')
    .select('business_id, businesses(id, name)')
    .eq('coach_id', profile.id);

  const businesses = await Promise.all(
    (memberships ?? []).map(async (m: any) => {
      const { data: memberRows } = await supabase
        .from('business_members')
        .select('coach_id, profiles(id, full_name, avatar_url)')
        .eq('business_id', m.business_id);

      const coaches = (memberRows ?? []).map((r: any) => r.profiles).filter(Boolean);
      const coachIds = coaches.map((c: any) => c.id);

      const { data: rawTeamClients } = await supabase
        .from('profiles')
        .select('id, coach_id, business_id')
        .in('coach_id', coachIds.length > 0 ? coachIds : ['00000000-0000-0000-0000-000000000000']);

      const teamClients = (rawTeamClients ?? []).filter(
        (c) => c.business_id === null || c.business_id === m.business_id
      );

      const coacheeCounts: Record<string, number> = {};
      teamClients.forEach((c) => {
        if (c.coach_id) coacheeCounts[c.coach_id] = (coacheeCounts[c.coach_id] ?? 0) + 1;
      });

      return {
        id: m.business_id,
        name: m.businesses?.name,
        coaches,
        coacheeCounts,
        totalCoachees: teamClients.length,
      };
    })
  );

  // Flat list: every coach across every business I'm in, paired with that business's name
  const coachRows: {
    coachId: string;
    coachName: string;
    avatarUrl: string | null;
    businessId: string;
    businessName: string;
  }[] = [];

  businesses.forEach((b) => {
    b.coaches.forEach((c: any) => {
      coachRows.push({
        coachId: c.id,
        coachName: c.full_name,
        avatarUrl: c.avatar_url,
        businessId: b.id,
        businessName: b.name,
      });
    });
  });
  coachRows.sort((a, b) => a.coachName.localeCompare(b.coachName));

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {profile.full_name.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Here's how your coachees are progressing.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-semibold text-brand-600">{clients?.length ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Coachees</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-semibold text-brand-600">
              {totalTargets > 0 ? `${achievedTargets}/${totalTargets}` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Targets achieved</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-semibold text-brand-600">{resourceCount ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Resources shared</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/resources" className="card hover:shadow-md transition block">
            <p className="font-medium mb-1">📁 Resources</p>
            <p className="text-sm text-gray-500">Share the tools that help clients grow</p>
          </Link>
          <Link href="/business" className="card hover:shadow-md transition block">
            <p className="font-medium mb-1">🏢 Business</p>
            <p className="text-sm text-gray-500">Team overview & reports</p>
          </Link>
          <Link href="/archive" className="card hover:shadow-md transition block">
            <p className="font-medium mb-1">🗄️ Archive</p>
            <p className="text-sm text-gray-500">Reclaim removed coachees</p>
          </Link>
        </div>

        {businesses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Coaches</h2>
            <div className="card divide-y divide-gray-100">
              {coachRows.map((row, i) => (
                <Link
                  key={`${row.businessId}-${row.coachId}`}
                  href={row.coachId === profile.id ? '/dashboard' : `/business/${row.businessId}/coach/${row.coachId}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-medium overflow-hidden">
                      {row.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        row.coachName?.[0]?.toUpperCase() ?? '?'
                      )}
                    </span>
                    <span>
                      {row.coachName}
                      {row.coachId === profile.id && <span className="text-gray-400 text-sm"> (you)</span>}
                    </span>
                  </span>
                  <span className="text-sm text-gray-500">{row.businessName}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Your coachees</h2>
          </div>

          <div className="card mb-4">
            <h3 className="font-medium mb-3 text-sm">Invite a new coachee</h3>
            <InviteForm />
          </div>

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
              <p className="text-gray-500">No coachees yet — invite one above.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
