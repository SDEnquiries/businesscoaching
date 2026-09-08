import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  return (
    <main className="min-h-screen">
      <NavBar name={profile.full_name} role={profile.role} />
      <div className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Your profile</h1>
        <div className="card">
          <ProfileForm profile={profile} />
        </div>
      </div>
    </main>
  );
}
