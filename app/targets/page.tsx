import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import TargetsList, { type TargetRow } from './TargetsList';
import AddTargetForm from './AddTargetForm';
import GeneratePlanForm from './GeneratePlanForm';

const PLAN_LENGTH_MONTHS = 12;

function toMonthInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default async function TargetsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'client') redirect('/dashboard');

  const { data: targets } = await supabase
    .from('targets')
    .select('*')
    .eq('client_id', user.id)
    .order('period_month', { ascending: true });

  const rows = (targets ?? []) as TargetRow[];

  const namesById: Record<string, string> = { [profile.id]: profile.full_name };
  if (profile.coach_id) {
    const { data: coach } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', profile.coach_id)
      .single();
    if (coach) namesById[coach.id] = coach.full_name;
  }

  const lastMonth = rows[rows.length - 1]?.period_month;
  const nextMonthDate = lastMonth
    ? new Date(`${lastMonth}T00:00:00`)
    : new Date();
  if (lastMonth) nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const defaultMonth = toMonthInput(nextMonthDate);
  const nextMonthNumber = rows.length + 1;

  const planStartMonth = rows[0]?.period_month;
  const generateDefaultMonth = planStartMonth ? toMonthInput(new Date(`${planStartMonth}T00:00:00`)) : toMonthInput(new Date());

  const achievedCount = rows.filter((t) => t.status === 'achieved').length;

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold page-heading">Your targets</h1>
          <p className="page-subtext text-sm mt-1">
            {rows.length > 0
              ? `${rows.length} month${rows.length === 1 ? '' : 's'} planned, ${achievedCount} achieved.`
              : `Build up to ${PLAN_LENGTH_MONTHS} months of targets — you can always add more later.`}
          </p>
        </div>

        <GeneratePlanForm
          clientId={profile.id}
          defaultMonth={generateDefaultMonth}
          defaultCount={PLAN_LENGTH_MONTHS}
        />

        <TargetsList
          clientId={profile.id}
          targets={rows}
          namesById={namesById}
          currentUserId={user.id}
          planLengthMonths={PLAN_LENGTH_MONTHS}
          viewerIsCoach={false}
        />

        <AddTargetForm clientId={profile.id} defaultMonth={defaultMonth} nextMonthNumber={nextMonthNumber} />
      </div>
    </main>
  );
}
