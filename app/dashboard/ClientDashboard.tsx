import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import QuickAvatarUpload from '@/components/QuickAvatarUpload';
import ExpandableCard from '@/components/ExpandableCard';
import BusinessPlanForm from '@/app/business-plan/BusinessPlanForm';

export default async function ClientDashboard({ profile }: { profile: any }) {
  const supabase = createClient();

  const { data: entries } = await supabase
    .from('progress_entries')
    .select('*')
    .eq('client_id', profile.id)
    .order('created_at', { ascending: false });

  const { data: targets } = await supabase
    .from('targets')
    .select('*')
    .eq('client_id', profile.id)
    .order('period_month', { ascending: true });

  const { count: resourceCount } = await supabase
    .from('resources')
    .select('id', { count: 'exact', head: true });

  const { data: plan } = await supabase
    .from('business_plan')
    .select('*')
    .eq('client_id', profile.id)
    .maybeSingle();

  const { data: coach } = profile.coach_id
    ? await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', profile.coach_id).single()
    : { data: null };

  // Which business(es) this coachee belongs to: an explicit pin if set,
  // otherwise every business their coach is in.
  let businessNames: string[] = [];
  if (profile.business_id) {
    const { data: pinned } = await supabase.from('businesses').select('name').eq('id', profile.business_id).single();
    if (pinned) businessNames = [pinned.name];
  } else if (profile.coach_id) {
    const { data: coachBusinesses } = await supabase
      .from('business_members')
      .select('businesses(name)')
      .eq('coach_id', profile.coach_id);
    businessNames = (coachBusinesses ?? []).map((b: any) => b.businesses?.name).filter(Boolean);
  }

  const lastEntry = entries?.[0];

  const targetRows = targets ?? [];
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const achievedTargets = targetRows.filter((t) => t.status === 'achieved').length;
  const highlightTarget =
    targetRows.find((t) => t.period_month === currentMonthKey) ??
    targetRows.find((t) => t.status !== 'achieved') ??
    targetRows[targetRows.length - 1];

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="card flex items-center gap-5">
          <QuickAvatarUpload currentUrl={profile.avatar_url} fallbackLetter={profile.full_name?.[0]?.toUpperCase() ?? '?'} />
          <div>
            <h1 className="text-2xl font-semibold">Welcome back, {profile.full_name.split(' ')[0]}</h1>
            {coach ? (
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                Your coach:
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-[10px] font-medium overflow-hidden">
                    {coach.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coach.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      coach.full_name?.[0]?.toUpperCase()
                    )}
                  </span>
                  {coach.full_name}
                </span>
              </p>
            ) : (
              <p className="text-gray-500 text-sm mt-1">You don't have a coach assigned yet.</p>
            )}
            {businessNames.length > 0 && (
              <p className="text-gray-400 text-xs mt-1">
                {businessNames.length === 1 ? 'Business: ' : 'Businesses: '}
                {businessNames.join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-semibold text-brand-600">
              {targetRows.length > 0 ? `${achievedTargets}/${targetRows.length}` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Targets achieved</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-semibold text-brand-600">
              {lastEntry?.mood_rating ? `${lastEntry.mood_rating}/10` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Last logged mood</p>
          </div>
        </div>

        <ExpandableCard
          icon="🧭"
          title="Business plan"
          summary={
            plan?.current_state
              ? plan.current_state.slice(0, 80) + (plan.current_state.length > 80 ? '…' : '')
              : 'Start your business plan'
          }
          defaultOpen={!plan?.current_state}
        >
          <BusinessPlanForm clientId={profile.id} plan={plan ?? {}} canEditContent canEditFeedback={false} />
        </ExpandableCard>

        <ExpandableCard
          icon="🎯"
          title="Targets"
          summary={
            targetRows.length > 0
              ? `${achievedTargets} of ${targetRows.length} achieved${
                  highlightTarget ? ` — ${highlightTarget.title || 'this month'}` : ''
                }`
              : 'Build your target plan'
          }
        >
          <div className="space-y-3">
            {highlightTarget ? (
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {highlightTarget.title || 'Untitled target'}
                    {highlightTarget.pillar && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 align-middle">
                        {highlightTarget.pillar}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(`${highlightTarget.period_month}T00:00:00`).toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {(highlightTarget.target_value !== null || highlightTarget.actual_value !== null) && (
                  <div className="flex gap-4 text-xs text-gray-500">
                    {highlightTarget.target_value !== null && (
                      <span>
                        Target: {highlightTarget.target_value} {highlightTarget.target_unit}
                      </span>
                    )}
                    {highlightTarget.actual_value !== null && (
                      <span>
                        Actual: {highlightTarget.actual_value} {highlightTarget.target_unit}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No targets set yet — build your plan below.</p>
            )}
            <Link href="/targets" className="text-brand-600 text-sm hover:underline inline-block">
              View full target plan →
            </Link>
          </div>
        </ExpandableCard>

        <ExpandableCard
          icon="📈"
          title="Progress log"
          summary={
            lastEntry
              ? `Last entry ${new Date(lastEntry.created_at).toLocaleDateString()}`
              : 'Log your first entry'
          }
        >
          <div className="space-y-3">
            {entries && entries.length > 0 ? (
              entries.slice(0, 3).map((e) => (
                <div key={e.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{e.title || 'Untitled entry'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(e.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {e.journal_text && <p className="text-gray-700 text-sm mb-1">{e.journal_text}</p>}
                  <div className="flex gap-4 text-xs text-gray-500">
                    {e.mood_rating && <span>Mood: {e.mood_rating}/10</span>}
                    {e.metrics?.energy && <span>Energy: {e.metrics.energy}/10</span>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No entries yet — log your first one below.</p>
            )}
            <Link href="/progress" className="text-brand-600 text-sm hover:underline inline-block">
              View full progress log & add an entry →
            </Link>
          </div>
        </ExpandableCard>

        <ExpandableCard
          icon="📁"
          title="Resources"
          summary={`${resourceCount ?? 0} shared by your coach`}
        >
          <Link href="/resources" className="text-brand-600 text-sm hover:underline inline-block">
            View resources →
          </Link>
        </ExpandableCard>
      </div>
    </main>
  );
}
