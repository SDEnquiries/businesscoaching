import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import ProgressForm from '@/app/dashboard/ProgressForm';
import { deleteProgressEntry } from '@/app/actions';
import DeleteButton from '@/components/DeleteButton';

export default async function ProgressPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'client') redirect('/dashboard');

  const { data: entries } = await supabase
    .from('progress_entries')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-semibold">Progress log</h1>

        <div className="card">
          <h2 className="font-medium mb-3">Add an entry</h2>
          <ProgressForm />
        </div>

        <div className="grid gap-3">
          {entries && entries.length > 0 ? (
            entries.map((e) => (
              <div key={e.id} className="card">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{e.title || 'Untitled entry'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(e.created_at).toLocaleDateString()}
                    </span>
                    <DeleteButton
                      action={deleteProgressEntry}
                      fields={{ id: e.id, photo_url: e.photo_url ?? '' }}
                      confirmText="Delete this entry?"
                    />
                  </div>
                </div>
                {e.journal_text && <p className="text-gray-700 text-sm mb-2">{e.journal_text}</p>}
                <div className="flex gap-4 text-xs text-gray-500">
                  {e.mood_rating && <span>Mood: {e.mood_rating}/10</span>}
                  {e.metrics?.energy && <span>Energy: {e.metrics.energy}/10</span>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No entries yet — add your first one above.</p>
          )}
        </div>
      </div>
    </main>
  );
}
