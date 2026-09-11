import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import ResourceForm from './ResourceForm';
import ResourceItem from './ResourceItem';

export default async function ResourcesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  if (profile.role === 'coach') {
    const { data: clients } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('coach_id', user.id)
      .order('full_name');

    const { data: resources } = await supabase
      .from('resources')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });

    const filesWithUrls = await Promise.all(
      (resources ?? []).map(async (r) => {
        if (!r.file_url) return { ...r, fileHref: null };
        const { data } = await supabase.storage.from('resource-files').createSignedUrl(r.file_url, 3600);
        return { ...r, fileHref: data?.signedUrl ?? null };
      })
    );

    return (
      <main className="min-h-screen">
        <NavBar name={profile.full_name} role={profile.role} />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <h1 className="text-2xl font-semibold page-heading">Resources</h1>
          <div className="card">
            <h2 className="font-medium mb-3">Share a new resource</h2>
            <ResourceForm clients={clients ?? []} />
          </div>
          <div className="grid gap-3">
            {filesWithUrls.length > 0 ? (
              filesWithUrls.map((r) => (
                <ResourceItem key={r.id} resource={r} canDelete fileHref={r.fileHref} />
              ))
            ) : (
              <p className="page-subtext">Nothing shared yet.</p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Client view
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  const filesWithUrls = await Promise.all(
    (resources ?? []).map(async (r) => {
      if (!r.file_url) return { ...r, fileHref: null };
      const { data } = await supabase.storage.from('resource-files').createSignedUrl(r.file_url, 3600);
      return { ...r, fileHref: data?.signedUrl ?? null };
    })
  );

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-2xl font-semibold page-heading">Resources from your coach</h1>
        <div className="grid gap-3">
          {filesWithUrls.length > 0 ? (
            filesWithUrls.map((r) => <ResourceItem key={r.id} resource={r} canDelete={false} fileHref={r.fileHref} />)
          ) : (
            <p className="page-subtext">Nothing shared yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
