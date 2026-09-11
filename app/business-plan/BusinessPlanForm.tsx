'use client';

import { useState } from 'react';
import { updateBusinessPlanField, updateBusinessPlanFeedback } from '@/app/actions';

type PlanField = 'current_state' | 'vision' | 'focus_areas' | 'action_steps' | 'obstacles';

export type BusinessPlan = {
  current_state?: string | null;
  current_state_feedback?: string | null;
  vision?: string | null;
  vision_feedback?: string | null;
  focus_areas?: string | null;
  focus_areas_feedback?: string | null;
  action_steps?: string | null;
  action_steps_feedback?: string | null;
  obstacles?: string | null;
  obstacles_feedback?: string | null;
};

const SECTIONS: { field: PlanField; label: string; placeholder: string }[] = [
  {
    field: 'current_state',
    label: 'Current state',
    placeholder: 'What does the business do, and where is it right now?',
  },
  {
    field: 'vision',
    label: 'Vision & long-term goals',
    placeholder: 'What do you want the business to look like in 1–3 years?',
  },
  {
    field: 'focus_areas',
    label: 'Focus areas',
    placeholder: 'Which areas are you focusing on right now? e.g. Sales & marketing, Team, Cash flow',
  },
  {
    field: 'action_steps',
    label: 'Action steps',
    placeholder: 'What needs to happen next, and who’s doing it?',
  },
  {
    field: 'obstacles',
    label: 'Obstacles & support needed',
    placeholder: 'What’s likely to get in the way, and what support would help?',
  },
];

export default function BusinessPlanForm({
  clientId,
  plan,
  canEditContent,
  canEditFeedback,
}: {
  clientId: string;
  plan: BusinessPlan;
  canEditContent: boolean;
  canEditFeedback: boolean;
}) {
  return (
    <div className="space-y-3">
      {SECTIONS.map((s) => (
        <PlanSection
          key={s.field}
          clientId={clientId}
          field={s.field}
          label={s.label}
          placeholder={s.placeholder}
          value={plan[s.field] ?? ''}
          feedbackValue={plan[`${s.field}_feedback` as const] ?? ''}
          canEditContent={canEditContent}
          canEditFeedback={canEditFeedback}
        />
      ))}
    </div>
  );
}

function PlanSection({
  clientId,
  field,
  label,
  placeholder,
  value,
  feedbackValue,
  canEditContent,
  canEditFeedback,
}: {
  clientId: string;
  field: PlanField;
  label: string;
  placeholder: string;
  value: string;
  feedbackValue: string;
  canEditContent: boolean;
  canEditFeedback: boolean;
}) {
  const [content, setContent] = useState(value);
  const [editingContent, setEditingContent] = useState(canEditContent && !value);
  const [savingContent, setSavingContent] = useState(false);

  const [feedback, setFeedback] = useState(feedbackValue);
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);

  async function saveContent() {
    const formData = new FormData();
    formData.set('client_id', clientId);
    formData.set('field', field);
    formData.set('value', content);
    setSavingContent(true);
    await updateBusinessPlanField(formData);
    setSavingContent(false);
    setEditingContent(false);
  }

  async function saveFeedback() {
    const formData = new FormData();
    formData.set('client_id', clientId);
    formData.set('field', `${field}_feedback`);
    formData.set('value', feedback);
    setSavingFeedback(true);
    await updateBusinessPlanFeedback(formData);
    setSavingFeedback(false);
    setEditingFeedback(false);
  }

  return (
    <div className="card">
      <p className="label text-xs mb-2">{label}</p>

      {canEditContent ? (
        editingContent ? (
          <div className="space-y-2">
            <textarea
              className="input"
              rows={4}
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="button" onClick={saveContent} className="btn-primary text-sm" disabled={savingContent}>
                {savingContent ? 'Saving…' : 'Save'}
              </button>
              {value && (
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => {
                    setContent(value);
                    setEditingContent(false);
                  }}
                  disabled={savingContent}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <p className="text-gray-700 text-sm whitespace-pre-wrap flex-1">
              {value || <span className="text-gray-400">Not filled in yet</span>}
            </p>
            <button
              type="button"
              onClick={() => setEditingContent(true)}
              className="text-xs text-brand-600 hover:underline whitespace-nowrap"
            >
              Edit
            </button>
          </div>
        )
      ) : (
        <p className="text-gray-700 text-sm whitespace-pre-wrap">
          {value || <span className="text-gray-400">Not filled in yet</span>}
        </p>
      )}

      {(canEditFeedback || feedbackValue) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Coach feedback</p>
          {canEditFeedback ? (
            editingFeedback ? (
              <div className="space-y-2">
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Add feedback or suggestions…"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={saveFeedback} className="btn-primary text-sm" disabled={savingFeedback}>
                    {savingFeedback ? 'Saving…' : 'Save feedback'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    onClick={() => {
                      setFeedback(feedbackValue);
                      setEditingFeedback(false);
                    }}
                    disabled={savingFeedback}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-600 whitespace-pre-wrap flex-1 italic">
                  {feedbackValue || <span className="text-gray-400 not-italic">No feedback yet</span>}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingFeedback(true)}
                  className="text-xs text-brand-600 hover:underline whitespace-nowrap"
                >
                  {feedbackValue ? 'Edit' : 'Add feedback'}
                </button>
              </div>
            )
          ) : (
            feedbackValue && <p className="text-sm text-gray-600 whitespace-pre-wrap italic">{feedbackValue}</p>
          )}
        </div>
      )}
    </div>
  );
}
