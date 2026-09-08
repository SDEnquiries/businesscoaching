import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import { assignHomework, addSessionNote, deleteHomework, deleteSessionNote } from '@/app/actions';
import RemoveClientButton from './RemoveClientButton';
import AssignToCoach from '@/components/AssignToCoach';
import BusinessPicker from '@/components/BusinessPicker';
import DeleteButton from '@/components/DeleteButton';
import TargetsList, { type TargetRow } from '@/app/targets/TargetsList';
import AddTargetForm from '@/app/targets/AddTargetForm';
import GeneratePlanForm from '@/app/targets/GeneratePlanForm';

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

  const { data: homework } = await supabase
    .from('homework')
    .select('*, homework_submissions(*)')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false });

  const homeworkWithFileLinks = await Promise.all(
    (homework ?? []).map(async (hw: any) => {
      const submissions = await Promise.all(
        (hw.homework_submissions ?? []).map(async (s: any) => {
          if (!s.file_url) return { ...s, fileHref: null };
          const { data } = await supabase.storage.from('homework-files').createSignedUrl(s.file_url, 3600);
          return { ...s, fileHref: data?.signedUrl ?? null };
        })
      );
      return { ...hw, homework_submissions: submissions };
    })
  );

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
  const totalHomework = homework?.length ?? 0;
  const completedHomework = homework?.filter((h: any) => h.status !== 'assigned').length ?? 0;
  const avgMood =
    entries && entries.filter((e) => e.mood_rating).length > 0
      ? (
          entries.filter((e) => e.mood_rating).reduce((sum, e) => sum + e.mood_rating, 0) /
          entries.filter((e) => e.mood_rating).length
        ).toFixed(1)
      : null;

  async function handleAssign(formData: FormData) {
    'use server';
    formData.set('client_id', params.id);
    await assignHomework(formData);
  }

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
          <div className="card grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-brand-600">{totalHomework}</p>
              <p className="text-xs text-gray-500">Homework assigned</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-brand-600">{completedHomework}</p>
              <p className="text-xs text-gray-500">Completed</p>
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
          <h2 className="text-xl font-semibold mb-3">Assign homework</h2>
          <form action={handleAssign} className="card space-y-3">
            <input name="title" required placeholder="Title" className="input" />
            <textarea name="description" placeholder="Instructions" className="input" rows={2} />
            <div>
              <label className="label text-xs">Due date (optional)</label>
              <input name="due_date" type="date" className="input" />
            </div>
            <button type="submit" className="btn-primary text-sm">
              Assign
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Homework history</h2>
          <div className="grid gap-3">
            {homeworkWithFileLinks.length > 0 ? (
              homeworkWithFileLinks.map((hw: any) => (
                <div key={hw.id} className="card">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{hw.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {hw.status}
                      </span>
                      <DeleteButton
                        action={deleteHomework}
                        fields={{ id: hw.id, client_id: params.id }}
                        confirmText="Delete this homework?"
                      />
                    </div>
                  </div>
                  {hw.description && <p className="text-sm text-gray-600 mt-1">{hw.description}</p>}
                  {hw.due_date && <p className="text-xs text-gray-400 mt-1">Due {hw.due_date}</p>}
                  {hw.homework_submissions?.length > 0 && (
                    <div className="mt-2 border-t pt-2 text-sm text-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Response:</p>
                      {hw.homework_submissions.map((s: any) => (
                        <div key={s.id}>
                          {s.text_response && <p>{s.text_response}</p>}
                          {s.fileHref && (
                            <a
                              href={s.fileHref}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-600 text-sm underline mt-1 inline-block"
                            >
                              Open attachment
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No homework assigned yet.</p>
            )}
          </div>
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
