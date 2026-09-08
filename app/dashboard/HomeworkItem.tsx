'use client';

import { useState } from 'react';
import { submitHomework, deleteHomeworkSubmission } from '@/app/actions';
import DeleteButton from '@/components/DeleteButton';

export default function HomeworkItem({ homework }: { homework: any }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submissions = homework.homework_submissions ?? [];

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    formData.set('homework_id', homework.id);
    await submitHomework(formData);
    setSubmitting(false);
    setOpen(false);
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{homework.title}</p>
          {homework.description && (
            <p className="text-sm text-gray-600 mt-1">{homework.description}</p>
          )}
          {homework.due_date && (
            <p className="text-xs text-gray-400 mt-1">Due {homework.due_date}</p>
          )}
        </div>
        <span
          className={
            'text-xs px-2 py-1 rounded-full ' +
            (homework.status === 'assigned'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-[#eaf6d9] text-[#5b8a1f]')
          }
        >
          {homework.status}
        </span>
      </div>

      {homework.status === 'assigned' && (
        <div className="mt-3">
          {!open ? (
            <button className="btn-secondary text-sm" onClick={() => setOpen(true)}>
              Complete this
            </button>
          ) : (
            <form action={handleSubmit} className="space-y-2">
              <textarea
                name="text_response"
                className="input"
                rows={3}
                placeholder="Write your response…"
              />
              <input name="file" type="file" className="text-sm" />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {submissions.length > 0 && (
        <div className="mt-3 border-t pt-2 space-y-2">
          {submissions.map((s: any) => (
            <div key={s.id} className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-700">{s.text_response || 'File attached'}</p>
              <DeleteButton
                action={deleteHomeworkSubmission}
                fields={{ submission_id: s.id, homework_id: homework.id, file_url: s.file_url ?? '' }}
                label="Undo submission"
                confirmText="Remove this response? You'll be able to resubmit."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
