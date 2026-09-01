'use client';

import { useActionState, useTransition } from 'react';
import { ArrowDown, ArrowUp, Image as ImageIcon, SquarePlay, Trash2, Video } from 'lucide-react';
import type { MediaItem } from '@zporter/shared';
import {
  addChallengeMedia,
  removeChallengeMedia,
  reorderChallengeMedia,
  type MediaState,
} from '@/app/(dashboard)/challenges/actions';

const TYPE_ICON = {
  image: ImageIcon,
  video: Video,
  youtube: SquarePlay,
} as const;

/**
 * Owner-only gallery editor on the challenge detail page: list the current
 * media with reorder / remove, and an "add" form for files + a YouTube link.
 */
export function MediaManager({
  challengeId,
  media,
}: {
  challengeId: string;
  media: MediaItem[];
}) {
  const [state, action, adding] = useActionState<MediaState, FormData>(
    addChallengeMedia.bind(null, challengeId),
    {},
  );
  const [pending, startTransition] = useTransition();

  const items = media ?? [];
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    startTransition(() => reorderChallengeMedia(challengeId, next));
  };
  const remove = (index: number) =>
    startTransition(() => removeChallengeMedia(challengeId, index));

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {items.length === 0 && (
          <li className="text-[12px] text-faint">No media yet.</li>
        )}
        {items.map((item, i) => {
          const Icon = TYPE_ICON[item.type];
          return (
            <li
              key={item.url + i}
              className="flex items-center gap-2 rounded-[var(--radius-control)] bg-surface-2 px-2.5 py-1.5"
            >
              <span className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-black/40">
                {item.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                ) : item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Icon className="h-4 w-4 text-muted" />
                )}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] capitalize text-muted">
                <Icon className="h-3.5 w-3.5" />
                {item.type}
              </span>
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  disabled={pending || i === 0}
                  onClick={() => move(i, i - 1)}
                  className="rounded p-1 text-muted hover:bg-surface-3 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={pending || i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="rounded p-1 text-muted hover:bg-surface-3 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(i)}
                  className="rounded p-1 text-danger hover:bg-danger/10 disabled:opacity-30"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      <form action={action} className="space-y-2 border-t border-border-soft pt-3">
        <input
          type="file"
          name="mediaFiles"
          multiple
          accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
          className="block max-w-full text-[12px] text-muted file:mr-3 file:rounded-[var(--radius-control)] file:border-0 file:bg-surface-3 file:px-3 file:py-1.5 file:text-[12px] file:text-fg hover:file:bg-border"
        />
        <input
          type="url"
          name="youtubeLinks"
          placeholder="…or paste a YouTube link"
          className="h-9 w-full rounded-[var(--radius-control)] bg-field/80 px-3 text-[13px] text-fg ring-1 ring-white/[0.04] placeholder:text-faint focus:outline-none focus:ring-primary/50"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={adding}
            className="h-8 rounded-[var(--radius-control)] border border-border px-3 text-[12px] text-fg hover:bg-surface-2 disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add media'}
          </button>
          {state.error && <span className="text-[11px] text-danger">{state.error}</span>}
          {state.ok && <span className="text-[11px] text-success">Added.</span>}
        </div>
      </form>
    </div>
  );
}
