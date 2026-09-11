import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import { addSessionNote, deleteSessionNote } from '@/app/actions';
import RemoveClientButton from './RemoveClientButton';
import AssignToCoach from '@/components/AssignToCoach';
import BusinessPicker from '@/components/BusinessPicker';
import DeleteButton from '@/components/DeleteButton';
import TargetsList, { type TargetRow } from '@/app/targets/TargetsList';
import AddTargetForm from '@/app/targets/AddTargetForm';
import GeneratePlanForm from '@/app/targets/GeneratePlanForm';
import BusinessInfoForm from '@/app/business-info/BusinessInfoForm';

const PLAN_LENGTH_MONTHS = 12;

function toMonthInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: client } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!client) redirect('/dashboard');

  const { data: entries } = await supabase
    .from('progress_entries')
    .select('*')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false });

  const { data: sessionNotes } = await supabase
    .from('session_notes')
    .select('*')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false });

  const { data: targets } = await supabase
    .from('targets')
    .select('*')
    .eq('client_id', params.id)
    .order('period_month', { ascending: true });

  const targetRows = (targets ?? []) as TargetRow[];
  const namesById: Record<string, string> = {
    [client.id]: client.full_name,
    [user.id]: coachProfile?.full_name ?? '',
  };
  const lastTargetMonth = targetRows[targetRows.length - 1]?.period_month;
  const nextTargetMonthDate = lastTargetMonth ? new Date(`${lastTargetMonth}T00:00:00`) : new Date();
  if (lastTargetMonth) nextTargetMonthDate.setMonth(nextTargetMonthDate.getMonth() + 1);
  const defaultTargetMonth = toMonthInput(nextTargetMonthDate);
  const nextTargetMonthNumber = targetRows.length + 1;
  const planStartMonth = targetRows[0]?.period_month;
  const generateTargetDefaultMonth = planStartMonth
    ? toMonthInput(new Date(`${planStartMonth}T00:00:00`))
    : toMonthInput(new Date());
  const achievedTargets = targetRows.filter((t) => t.status === 'achieved').length;

  async function handleAddNote(formData: FormData) {
    'use server';
    formData.set('client_id', params.id);
    await addSessionNote(formData);
  }

  // Quick report stats
  const avgMood =
    entries && entries.filter((e) => e.mood_rating).length > 0
      ? (
          entries.filter((e) => e.mood_rating).reduce((sum, e) => sum + e.mood_rating, 0) /
          entries.filter((e) => e.mood_rating).length
        ).toFixed(1)
      : null;

  // Teammates this coach could reassign the coachee to (only relevant if it's your own coachee)
  let assignableCoaches: { id: string; full_name: string }[] = [];
  let myBusinesses: { id: string; name: string }[] = [];
  if (client.coach_id === user.id) {
    const { data: memberships } = await supabase
      .from('business_members')
      .select('business_id, businesses(id, name)')
      .eq('coach_id', user.id);
    const businessIds = (memberships ?? []).map((m) => m.business_id);
    myBusinesses = (memberships ?? []).map((m: any) => m.businesses).filter(Boolean);

    const { data: teammateRows } = await supabase
      .from('business_members')
      .select('coach_id, profiles(id, full_name)')
      .in('business_id', businessIds.length > 0 ? businessIds : ['00000000-0000-0000-0000-000000000000']);

    const teammateMap = new Map<string, { id: string; full_name: string }>();
    (teammateRows ?? []).forEach((r: any) => {
      if (r.profiles && r.profiles.id !== user.id) teammateMap.set(r.profiles.id, r.profiles);
    });
    assignableCoaches = Array.from(teammateMap.values());
  }

  return (
    <main className="min-h-screen">
      <NavBar name={coachProfile?.full_name ?? ''} role="coach" />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-medium overflow-hidden">
              {client.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                client.full_name?.[0]?.toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{client.full_name}</h1>
              {client.bio && <p className="text-gray-600 text-sm">{client.bio}</p>}
            </div>
          </div>
          {client.coach_id === user.id && (
            <div className="flex flex-col items-end gap-2">
              {myBusinesses.length > 1 && (
                <BusinessPicker clientId={client.id} businesses={myBusinesses} currentBusinessId={client.business_id} />
              )}
              {assignableCoaches.length > 0 && (
                <AssignToCoach clientId={client.id} coaches={assignableCoaches} buttonLabel="Transfer to…" />
              )}
              <RemoveClientButton clientId={client.id} clientName={client.full_name} />
            </div>
          )}
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-3">Report</h2>
          <div className="card grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-brand-600">
                {targetRows.length > 0 ? `${achievedTargets}/${targetRows.length}` : '—'}
              </p>
              <p className="text-xs text-gray-500">Targets achieved</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-brand-600">{avgMood ?? '—'}</p>
              <p className="text-xs text-gray-500">Avg. mood /10</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Session notes (visible to your business team)</h2>
          <form action={handleAddNote} className="card space-y-3 mb-3">
            <textarea name="note_text" required placeholder="What happened in this session…" className="input" rows={3} />
            <input name="session_date" type="date" className="input" />
            <button type="submit" className="btn-primary text-sm">
              Save note
            </button>
          </form>
          <div className="grid gap-3">
            {sessionNotes && sessionNotes.length > 0 ? (
              sessionNotes.map((n: any) => (
                <div key={n.id} className="card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {n.session_date ?? new Date(n.created_at).toLocaleDateString()}
                    </span>
                    <DeleteButton
                      action={deleteSessionNote}
                      fields={{ id: n.id, client_id: params.id }}
                      confirmText="Delete this note?"
                    />
                  </div>
                  <p className="text-sm text-gray-700">{n.note_text}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No session notes yet.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Business information</h2>
          <BusinessInfoForm
            clientId={params.id}
            initialValue={client.business_info ?? ''}
            lastUpdatedLabel="Visible to the coachee and their coach"
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Targets</h2>
            {targetRows.length > 0 && (
              <span className="text-sm text-gray-500">
                {achievedTargets} of {targetRows.length} achieved
              </span>
            )}
          </div>
          <div className="space-y-3">
            <GeneratePlanForm
              clientId={params.id}
              defaultMonth={generateTargetDefaultMonth}
              defaultCount={PLAN_LENGTH_MONTHS}
            />
            <TargetsList
              clientId={params.id}
              targets={targetRows}
              namesById={namesById}
              currentUserId={user.id}
              planLengthMonths={PLAN_LENGTH_MONTHS}
            />
            <AddTargetForm
              clientId={params.id}
              defaultMonth={defaultTargetMonth}
              nextMonthNumber={nextTargetMonthNumber}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Progress log</h2>
          <div className="grid gap-3">
            {entries && entries.length > 0 ? (
              entries.map((e) => (
                <div key={e.id} className="card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{e.title || 'Untitled entry'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(e.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {e.journal_text && <p className="text-gray-700 text-sm mb-2">{e.journal_text}</p>}
                  <div className="flex gap-4 text-xs text-gray-500">
                    {e.mood_rating && <span>Mood: {e.mood_rating}/10</span>}
                    {e.metrics?.energy && <span>Energy: {e.metrics.energy}/10</span>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No progress entries yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
