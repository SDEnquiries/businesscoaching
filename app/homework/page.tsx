import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import HomeworkItem from '@/app/dashboard/HomeworkItem';

export default async function HomeworkPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'client') redirect('/dashboard');

  const { data: homework } = await supabase
    .from('homework')
    .select('*, homework_submissions(*)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false });

  const pending = homework?.filter((h) => h.status === 'assigned') ?? [];
  const done = homework?.filter((h) => h.status !== 'assigned') ?? [];

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-semibold">Your homework</h1>

        <section>
          <h2 className="text-lg font-medium mb-3 text-gray-700">To do ({pending.length})</h2>
          <div className="grid gap-3">
            {pending.length > 0 ? (
              pending.map((hw) => <HomeworkItem key={hw.id} homework={hw} />)
            ) : (
              <p className="text-gray-500">Nothing pending — you're all caught up.</p>
            )}
          </div>
        </section>

        {done.length > 0 && (
          <section>
            <h2 className="text-lg font-medium mb-3 text-gray-700">Completed</h2>
            <div className="grid gap-3">
              {done.map((hw) => (
                <HomeworkItem key={hw.id} homework={hw} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
