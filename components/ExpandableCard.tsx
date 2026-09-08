'use client';

import { useState, ReactNode } from 'react';

export default function ExpandableCard({
  icon,
  title,
  summary,
  children,
  defaultOpen = false,
}: {
  icon: string;
  title: string;
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <p className="font-medium mb-0.5">
            {icon} {title}
          </p>
          <p className="text-sm text-gray-500">{summary}</p>
        </div>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="mt-4 pt-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}
