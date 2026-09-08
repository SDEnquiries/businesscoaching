import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CoachDashboard from './CoachDashboard';
import ClientDashboard from './ClientDashboard';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  if (profile.role === 'coach') {
    return <CoachDashboard profile={profile} />;
  }
  return <ClientDashboard profile={profile} />;
}
