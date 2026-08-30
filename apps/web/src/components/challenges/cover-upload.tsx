'use client';

import { useActionState } from 'react';
import { uploadCover, type CoverState } from '@/app/(dashboard)/challenges/actions';
import { Image as ImageIcon } from 'lucide-react';

export function CoverUpload({
  challengeId,
  current,
}: {
  challengeId: string;
  current?: string;
}) {
  const [state, action, pending] = useActionState<CoverState, FormData>(
    uploadCover.bind(null, challengeId),
    {},
  );

  return (
    <form action={action} className="flex items-center gap-4">
      <span className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] bg-surface-2 text-faint">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="cover" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-5 w-5" />
        )}
      </span>
      <div className="space-y-2">
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/webp"
          required
          className="block max-w-full text-[12px] text-muted file:mr-3 file:rounded-[var(--radius-control)] file:border-0 file:bg-surface-3 file:px-3 file:py-1.5 file:text-[12px] file:text-fg hover:file:bg-border"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="h-8 rounded-[var(--radius-control)] border border-border px-3 text-[12px] text-fg hover:bg-surface-2 disabled:opacity-50"
          >
            {pending ? 'Uploading…' : current ? 'Replace cover' : 'Upload cover'}
          </button>
          {state.error && <span className="text-[11px] text-danger">{state.error}</span>}
          {state.ok && <span className="text-[11px] text-success">Saved.</span>}
        </div>
      </div>
    </form>
  );
}
