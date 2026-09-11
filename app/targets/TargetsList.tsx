'use client';

import { useState } from 'react';
import { saveTarget, deleteTarget, updateTargetFeedback } from '@/app/actions';
import DeleteButton from '@/components/DeleteButton';

export type TargetRow = {
  id: string;
  client_id: string;
  period_month: string; // 'YYYY-MM-01'
  title: string;
  description: string | null;
  pillar: string | null;
  target_value: number | null;
  target_unit: string | null;
  actual_value: number | null;
  status: 'not_started' | 'in_progress' | 'achieved' | 'missed';
  coach_feedback: string | null;
  created_by: string;
  last_updated_by: string | null;
};

const STATUS_LABEL: Record<TargetRow['status'], string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  achieved: 'Achieved',
  missed: 'Missed',
};

const STATUS_STYLE: Record<TargetRow['status'], string> = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-orange-100 text-orange-700',
  achieved: 'bg-[#eaf6d9] text-[#5b8a1f]',
  missed: 'bg-red-100 text-red-600',
};

function monthLabel(periodMonth: string) {
  const d = new Date(`${periodMonth}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function monthInputValue(periodMonth: string) {
  return periodMonth.slice(0, 7); // 'YYYY-MM'
}

function monthsBetween(fromMonth: string, toMonth: string) {
  const from = new Date(`${fromMonth}T00:00:00`);
  const to = new Date(`${toMonth}T00:00:00`);
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

export default function TargetsList({
  clientId,
  targets,
  namesById,
  currentUserId,
  planLengthMonths = 12,
  viewerIsCoach = false,
}: {
  clientId: string;
  targets: TargetRow[];
  namesById: Record<string, string>;
  currentUserId: string;
  planLengthMonths?: number;
  viewerIsCoach?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  const planStart = targets[0]?.period_month;

  function nameFor(id: string | null) {
    if (!id) return null;
    if (id === currentUserId) return 'You';
    return namesById[id] ?? 'Someone';
  }

  async function handleSave(formData: FormData, id: string) {
    setSavingId(id);
    await saveTarget(formData);
    setSavingId(null);
    setEditingId(null);
  }

  async function handleSaveFeedback(id: string, coachFeedback: string) {
    const formData = new FormData();
    formData.set('id', id);
    formData.set('client_id', clientId);
    formData.set('coach_feedback', coachFeedback);
    setSavingFeedbackId(id);
    await updateTargetFeedback(formData);
    setSavingFeedbackId(null);
    setEditingFeedbackId(null);
  }

  if (targets.length === 0) {
    return <p className="text-gray-500">No targets yet — build your plan below.</p>;
  }

  return (
    <div className="grid gap-3">
      {targets.map((t) => {
        const monthNumber = planStart ? monthsBetween(planStart, t.period_month) + 1 : 1;
        const isEditing = editingId === t.id;
        const isSaving = savingId === t.id;

        return (
          <div key={t.id} className="card">
            {!isEditing ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-400">
                        Month {monthNumber}
                        {monthNumber > planLengthMonths ? ' (extended)' : ` of ${planLengthMonths}`}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{monthLabel(t.period_month)}</span>
                    </div>
                    <p className="font-medium mt-1">
                      {t.title || 'Untitled target'}
                      {t.pillar && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 align-middle">
                          {t.pillar}
                        </span>
                      )}
                    </p>
                    {t.description && <p className="text-sm text-gray-600 mt-1">{t.description}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLE[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>

                {(t.target_value !== null || t.actual_value !== null) && (
                  <div className="mt-2 flex gap-4 text-sm text-gray-700">
                    {t.target_value !== null && (
                      <span>
                        Target: <span className="font-medium">{t.target_value}</span> {t.target_unit}
                      </span>
                    )}
                    {t.actual_value !== null && (
                      <span>
                        Actual: <span className="font-medium">{t.actual_value}</span> {t.target_unit}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {nameFor(t.last_updated_by ?? t.created_by) &&
                      `Last set by ${nameFor(t.last_updated_by ?? t.created_by)}`}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(t.id)}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <DeleteButton
                      action={deleteTarget}
                      fields={{ id: t.id, client_id: clientId }}
                      confirmText="Remove this month's target?"
                    />
                  </div>
                </div>

                {(viewerIsCoach || t.coach_feedback) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Coach feedback</p>
                    {viewerIsCoach ? (
                      editingFeedbackId === t.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="input"
                            rows={3}
                            placeholder="Add feedback or suggestions…"
                            value={feedbackDrafts[t.id] ?? t.coach_feedback ?? ''}
                            onChange={(e) =>
                              setFeedbackDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn-primary text-sm"
                              disabled={savingFeedbackId === t.id}
                              onClick={() =>
                                handleSaveFeedback(t.id, feedbackDrafts[t.id] ?? t.coach_feedback ?? '')
                              }
                            >
                              {savingFeedbackId === t.id ? 'Saving…' : 'Save feedback'}
                            </button>
                            <button
                              type="button"
                              className="btn-secondary text-sm"
                              onClick={() => setEditingFeedbackId(null)}
                              disabled={savingFeedbackId === t.id}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-gray-600 whitespace-pre-wrap flex-1 italic">
                            {t.coach_feedback || <span className="text-gray-400 not-italic">No feedback yet</span>}
                          </p>
                          <button
                            type="button"
                            onClick={() => setEditingFeedbackId(t.id)}
                            className="text-xs text-brand-600 hover:underline whitespace-nowrap"
                          >
                            {t.coach_feedback ? 'Edit' : 'Add feedback'}
                          </button>
                        </div>
                      )
                    ) : (
                      t.coach_feedback && (
                        <p className="text-sm text-gray-600 whitespace-pre-wrap italic">{t.coach_feedback}</p>
                      )
                    )}
                  </div>
                )}
              </>
            ) : (
              <form
                action={async (formData) => {
                  formData.set('client_id', clientId);
                  formData.set('period_month', monthInputValue(t.period_month));
                  await handleSave(formData, t.id);
                }}
                className="space-y-3"
              >
                <p className="text-xs text-gray-400">{monthLabel(t.period_month)}</p>
                <input name="title" defaultValue={t.title} required placeholder="Target title" className="input" />
                <textarea
                  name="description"
                  defaultValue={t.description ?? ''}
                  placeholder="Details (optional)"
                  className="input"
                  rows={2}
                />
                <div>
                  <label className="label text-xs">Focus area</label>
                  <input name="pillar" defaultValue={t.pillar ?? ''} placeholder="e.g. Sales, Team, Cash flow" className="input" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label text-xs">Target value</label>
                    <input name="target_value" type="number" step="any" defaultValue={t.target_value ?? ''} className="input" />
                  </div>
                  <div>
                    <label className="label text-xs">Unit</label>
                    <input name="target_unit" defaultValue={t.target_unit ?? ''} placeholder="e.g. £, clients" className="input" />
                  </div>
                  <div>
                    <label className="label text-xs">Actual so far</label>
                    <input name="actual_value" type="number" step="any" defaultValue={t.actual_value ?? ''} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Status</label>
                  <select name="status" defaultValue={t.status} className="input">
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="achieved">Achieved</option>
                    <option value="missed">Missed</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm" disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" className="btn-secondary text-sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
