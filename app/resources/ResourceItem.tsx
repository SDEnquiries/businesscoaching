'use client';

import { deleteResource } from '@/app/actions';

const typeLabels: Record<string, string> = { link: '🔗 Link', video: '🎬 Video', file: '📄 File' };

export default function ResourceItem({
  resource,
  canDelete,
  fileHref,
}: {
  resource: any;
  canDelete: boolean;
  fileHref?: string | null;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-1">{typeLabels[resource.resource_type] ?? resource.resource_type}</p>
          <p className="font-medium">{resource.title}</p>
          {resource.description && <p className="text-sm text-gray-600 mt-1">{resource.description}</p>}
          {resource.url && (
            <a href={resource.url} target="_blank" rel="noreferrer" className="text-brand-600 text-sm underline mt-1 inline-block">
              Open link
            </a>
          )}
          {fileHref && (
            <a href={fileHref} target="_blank" rel="noreferrer" className="text-brand-600 text-sm underline mt-1 inline-block">
              Open file
            </a>
          )}
          {resource.client_id === null && (
            <p className="text-xs text-gray-400 mt-1">Shared with all coachees</p>
          )}
        </div>
        {canDelete && (
          <form action={deleteResource}>
            <input type="hidden" name="id" value={resource.id} />
            <button type="submit" className="text-xs text-red-500 hover:underline">
              Delete
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
