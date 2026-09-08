'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function assignHomework(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const clientId = String(formData.get('client_id'));
  const title = String(formData.get('title'));
  const description = String(formData.get('description') ?? '');
  const dueDate = formData.get('due_date') ? String(formData.get('due_date')) : null;

  const { error } = await supabase.from('homework').insert({
    coach_id: user.id,
    client_id: clientId,
    title,
    description,
    due_date: dueDate,
  });
  if (error) throw error;

  revalidatePath(`/clients/${clientId}`);
}

export async function submitHomework(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const homeworkId = String(formData.get('homework_id'));
  const textResponse = String(formData.get('text_response') ?? '');
  const file = formData.get('file') as File | null;

  let fileUrl: string | null = null;
  if (file && file.size > 0) {
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('homework-files')
      .upload(path, file);
    if (uploadError) throw uploadError;
    fileUrl = path;
  }

  const { error } = await supabase.from('homework_submissions').insert({
    homework_id: homeworkId,
    client_id: user.id,
    text_response: textResponse,
    file_url: fileUrl,
  });
  if (error) throw error;

  await supabase.from('homework').update({ status: 'submitted' }).eq('id', homeworkId);

  revalidatePath('/dashboard');
}

export async function deleteHomework(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id'));
  const clientId = String(formData.get('client_id'));

  // Clean up any submitted files before the row (and its submissions) cascade-delete.
  const { data: submissions } = await supabase
    .from('homework_submissions')
    .select('file_url')
    .eq('homework_id', id);

  const filePaths = (submissions ?? []).map((s) => s.file_url).filter(Boolean) as string[];
  if (filePaths.length > 0) {
    await supabase.storage.from('homework-files').remove(filePaths);
  }

  const { error } = await supabase.from('homework').delete().eq('id', id).eq('coach_id', user.id);
  if (error) throw error;

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteHomeworkSubmission(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const submissionId = String(formData.get('submission_id'));
  const homeworkId = String(formData.get('homework_id'));
  const fileUrl = formData.get('file_url') ? String(formData.get('file_url')) : null;

  if (fileUrl) {
    await supabase.storage.from('homework-files').remove([fileUrl]);
  }

  const { error } = await supabase
    .from('homework_submissions')
    .delete()
    .eq('id', submissionId)
    .eq('client_id', user.id);
  if (error) throw error;

  // Reopen the homework item so it can be redone.
  await supabase
    .from('homework')
    .update({ status: 'assigned' })
    .eq('id', homeworkId)
    .eq('client_id', user.id);

  revalidatePath('/homework');
  revalidatePath('/dashboard');
}

export async function deleteSessionNote(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id'));
  const clientId = String(formData.get('client_id'));

  const { error } = await supabase.from('session_notes').delete().eq('id', id).eq('coach_id', user.id);
  if (error) throw error;

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteProgressEntry(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id'));
  const photoUrl = formData.get('photo_url') ? String(formData.get('photo_url')) : null;

  if (photoUrl) {
    await supabase.storage.from('progress-photos').remove([photoUrl]);
  }

  const { error } = await supabase.from('progress_entries').delete().eq('id', id).eq('client_id', user.id);
  if (error) throw error;

  revalidatePath('/progress');
  revalidatePath('/dashboard');
}

export async function addProgressEntry(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const title = String(formData.get('title') ?? '');
  const journalText = String(formData.get('journal_text') ?? '');
  const moodRating = formData.get('mood_rating') ? Number(formData.get('mood_rating')) : null;
  const energy = formData.get('energy') ? Number(formData.get('energy')) : null;
  const photo = formData.get('photo') as File | null;

  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    const path = `${user.id}/${Date.now()}-${photo.name}`;
    const { error: uploadError } = await supabase.storage
      .from('progress-photos')
      .upload(path, photo);
    if (uploadError) throw uploadError;
    photoUrl = path;
  }

  const { error } = await supabase.from('progress_entries').insert({
    client_id: user.id,
    title,
    journal_text: journalText,
    mood_rating: moodRating,
    metrics: energy !== null ? { energy } : {},
    photo_url: photoUrl,
  });
  if (error) throw error;

  revalidatePath('/dashboard');
}

export async function createInvite(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const email = String(formData.get('email'));

  const { data, error } = await supabase
    .from('invites')
    .insert({ coach_id: user.id, email })
    .select('token')
    .single();
  if (error) throw error;

  revalidatePath('/dashboard');
  return data.token as string;
}

export async function addResource(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const title = String(formData.get('title'));
  const description = String(formData.get('description') ?? '');
  const resourceType = String(formData.get('resource_type') ?? 'link');
  const url = String(formData.get('url') ?? '');
  const clientId = formData.get('client_id') ? String(formData.get('client_id')) : null;
  const file = formData.get('file') as File | null;

  let fileUrl: string | null = null;
  if (file && file.size > 0) {
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('resource-files')
      .upload(path, file);
    if (uploadError) throw uploadError;
    fileUrl = path;
  }

  const { error } = await supabase.from('resources').insert({
    coach_id: user.id,
    client_id: clientId,
    title,
    description,
    resource_type: resourceType,
    url: url || null,
    file_url: fileUrl,
  });
  if (error) throw error;

  revalidatePath('/dashboard');
  revalidatePath('/resources');
}

export async function deleteResource(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id'));
  const { error } = await supabase.from('resources').delete().eq('id', id).eq('coach_id', user.id);
  if (error) throw error;

  revalidatePath('/resources');
}

export async function addSessionNote(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const clientId = String(formData.get('client_id'));
  const noteText = String(formData.get('note_text'));
  const sessionDate = formData.get('session_date') ? String(formData.get('session_date')) : null;

  const { error } = await supabase.from('session_notes').insert({
    coach_id: user.id,
    client_id: clientId,
    note_text: noteText,
    session_date: sessionDate,
  });
  if (error) throw error;

  revalidatePath(`/clients/${clientId}`);
}

export async function createBusiness(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const name = String(formData.get('name'));

  const { data, error } = await supabase
    .from('businesses')
    .insert({ name, created_by: user.id })
    .select('id')
    .single();
  if (error) throw error;

  await supabase.from('business_members').insert({ business_id: data.id, coach_id: user.id });

  revalidatePath('/business');
}

export async function inviteCoachToBusiness(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const email = String(formData.get('email'));
  const businessId = String(formData.get('business_id'));

  const { data, error } = await supabase
    .from('business_invites')
    .insert({ business_id: businessId, email })
    .select('token')
    .single();
  if (error) throw error;

  revalidatePath(`/business/${businessId}`);
  return data.token as string;
}

export async function joinBusiness(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const token = String(formData.get('token'));
  const { data: invite } = await supabase
    .from('business_invites')
    .select('business_id, status')
    .eq('token', token)
    .single();

  if (!invite || invite.status !== 'pending') throw new Error('Invalid or already-used invite');

  const { error } = await supabase
    .from('business_members')
    .insert({ business_id: invite.business_id, coach_id: user.id });
  if (error) throw error;

  await supabase.from('business_invites').update({ status: 'claimed' }).eq('token', token);

  revalidatePath('/business');
}

export async function removeClient(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const clientId = String(formData.get('client_id'));

  // Only unlink — never delete the client's account or their data.
  const { error } = await supabase
    .from('profiles')
    .update({ coach_id: null })
    .eq('id', clientId)
    .eq('coach_id', user.id); // safety check: can only remove your own clients

  if (error) throw error;

  revalidatePath('/dashboard');
}

export async function claimArchivedClient(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const clientId = String(formData.get('client_id'));

  const { error } = await supabase
    .from('profiles')
    .update({ coach_id: user.id })
    .eq('id', clientId)
    .is('coach_id', null); // safety check: can only claim truly unassigned clients

  if (error) throw error;

  revalidatePath('/archive');
  revalidatePath('/dashboard');
}

export async function leaveBusiness(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const businessId = String(formData.get('business_id'));

  const { error } = await supabase
    .from('business_members')
    .delete()
    .eq('business_id', businessId)
    .eq('coach_id', user.id);
  if (error) throw error;

  revalidatePath('/business');
}

export async function assignClientToCoach(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const clientId = String(formData.get('client_id'));
  const newCoachId = String(formData.get('coach_id'));

  const { error } = await supabase
    .from('profiles')
    .update({ coach_id: newCoachId })
    .eq('id', clientId);
  if (error) throw error;

  revalidatePath('/archive');
  revalidatePath('/dashboard');
  revalidatePath(`/clients/${clientId}`);
}

export async function updateAvatarOnly(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const avatar = formData.get('avatar') as File | null;
  if (!avatar || avatar.size === 0) throw new Error('No file provided');

  const path = `${user.id}/${Date.now()}-${avatar.name}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatar, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);

  const { error } = await supabase.from('profiles').update({ avatar_url: pub.publicUrl }).eq('id', user.id);
  if (error) throw error;

  revalidatePath('/dashboard');
  revalidatePath('/profile');
}

export async function setClientBusiness(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const clientId = String(formData.get('client_id'));
  const businessId = formData.get('business_id') ? String(formData.get('business_id')) : null;

  const { error } = await supabase
    .from('profiles')
    .update({ business_id: businessId })
    .eq('id', clientId);
  if (error) throw error;

  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/business');
  revalidatePath('/dashboard');
}

export async function renameBusiness(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const businessId = String(formData.get('business_id'));
  const name = String(formData.get('name'));

  const { error } = await supabase.from('businesses').update({ name }).eq('id', businessId);
  if (error) throw error;

  revalidatePath(`/business/${businessId}`);
  revalidatePath('/business');
  revalidatePath('/dashboard');
}

function firstOfMonth(monthInput: string): string {
  // monthInput comes from an <input type="month"> as "YYYY-MM"
  const [year, month] = monthInput.split('-');
  return `${year}-${month}-01`;
}

export async function saveTarget(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const clientId = String(formData.get('client_id'));
  const periodMonth = firstOfMonth(String(formData.get('period_month')));
  const title = String(formData.get('title') ?? '');
  const description = String(formData.get('description') ?? '');
  const targetValueRaw = formData.get('target_value');
  const targetValue = targetValueRaw && String(targetValueRaw) !== '' ? Number(targetValueRaw) : null;
  const targetUnit = String(formData.get('target_unit') ?? '');
  const actualValueRaw = formData.get('actual_value');
  const actualValue = actualValueRaw && String(actualValueRaw) !== '' ? Number(actualValueRaw) : null;
  const status = String(formData.get('status') ?? 'not_started');

  // Preserve who originally created this month's target across edits.
  const { data: existing } = await supabase
    .from('targets')
    .select('created_by')
    .eq('client_id', clientId)
    .eq('period_month', periodMonth)
    .maybeSingle();

  const { error } = await supabase.from('targets').upsert(
    {
      client_id: clientId,
      period_month: periodMonth,
      title,
      description,
      target_value: targetValue,
      target_unit: targetUnit,
      actual_value: actualValue,
      status,
      created_by: existing?.created_by ?? user.id,
      last_updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'client_id,period_month' }
  );
  if (error) throw error;

  revalidatePath('/targets');
  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/dashboard');
}

export async function deleteTarget(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const id = String(formData.get('id'));
  const clientId = String(formData.get('client_id'));

  // RLS (client owns it, or is the coach of this client) is what actually
  // enforces who may delete which row.
  const { error } = await supabase.from('targets').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/targets');
  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/dashboard');
}

export async function generateTargetPlan(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const clientId = String(formData.get('client_id'));
  const startMonthInput = String(formData.get('start_month')); // "YYYY-MM"
  const rawCount = Number(formData.get('months_count') ?? 12);
  const count = Math.min(Math.max(Math.round(rawCount) || 12, 1), 36);

  const [startYear, startMonth] = startMonthInput.split('-').map(Number);

  const wantedMonths: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startYear, startMonth - 1 + i, 1);
    wantedMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
  }

  const { data: existingRows } = await supabase
    .from('targets')
    .select('period_month')
    .eq('client_id', clientId)
    .in('period_month', wantedMonths);

  const existingMonths = new Set((existingRows ?? []).map((r) => r.period_month));
  const missingMonths = wantedMonths.filter((m) => !existingMonths.has(m));

  if (missingMonths.length > 0) {
    const rows = missingMonths.map((periodMonth) => ({
      client_id: clientId,
      period_month: periodMonth,
      title: '',
      status: 'not_started' as const,
      created_by: user.id,
      last_updated_by: user.id,
    }));
    const { error } = await supabase.from('targets').insert(rows);
    if (error) throw error;
  }

  revalidatePath('/targets');
  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/dashboard');
}

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fullName = String(formData.get('full_name'));
  const bio = String(formData.get('bio') ?? '');
  const avatar = formData.get('avatar') as File | null;

  let avatarUrl: string | undefined;
  if (avatar && avatar.size > 0) {
    const path = `${user.id}/${Date.now()}-${avatar.name}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatar, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    avatarUrl = pub.publicUrl;
  }

  const updates: Record<string, unknown> = { full_name: fullName, bio };
  if (avatarUrl) updates.avatar_url = avatarUrl;

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
  if (error) throw error;

  revalidatePath('/profile');
}
