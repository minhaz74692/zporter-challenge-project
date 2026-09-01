'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Share2, SquarePlay, Video, X } from 'lucide-react';
import type { MediaItem } from '@zporter/shared';

/**
 * The create/edit form's media row. Selected files stay in a hidden
 * `<input type=file name="mediaFiles">`; each added YouTube link becomes a
 * hidden `<input name="youtubeLinks">`. `attachFormMedia` (Server Action)
 * uploads them right after the challenge is saved.
 *
 * `carried` (a copy's existing gallery) is re-sent as JSON via `mediaJson`.
 */
export function MediaPicker({ carried = [] }: { carried?: MediaItem[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [showLink, setShowLink] = useState(false);
  const [draft, setDraft] = useState('');

  const pick = (accept: string) => {
    if (!fileRef.current) return;
    fileRef.current.accept = accept;
    fileRef.current.click();
  };

  const addLink = () => {
    const v = draft.trim();
    if (v && !links.includes(v)) setLinks((l) => [...l, v]);
    setDraft('');
    setShowLink(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <IconButton title="Add image" onClick={() => pick('image/png,image/jpeg,image/webp')}>
          <ImageIcon className="h-[18px] w-[18px]" />
        </IconButton>
        <IconButton
          title="Add video"
          onClick={() => pick('video/mp4,video/quicktime,video/webm')}
        >
          <Video className="h-[18px] w-[18px]" />
        </IconButton>
        <IconButton title="Add YouTube link" onClick={() => setShowLink(true)}>
          <SquarePlay className="h-[18px] w-[18px]" />
        </IconButton>
        <span
          title="Share (coming soon)"
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] bg-field/80 text-faint ring-1 ring-white/[0.04]"
        >
          <Share2 className="h-[18px] w-[18px]" />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zai.png" alt="Zai" className="ml-auto h-5 w-auto" />
      </div>

      <input
        ref={fileRef}
        type="file"
        name="mediaFiles"
        multiple
        hidden
        onChange={(e) =>
          setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))
        }
      />

      {showLink && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="https://youtube.com/watch?v=…"
            className="h-9 flex-1 rounded-[var(--radius-control)] bg-field/80 px-3 text-[13px] text-fg ring-1 ring-white/[0.04] placeholder:text-faint focus:outline-none focus:ring-primary/50"
          />
          <button
            type="button"
            onClick={addLink}
            className="h-9 rounded-[var(--radius-control)] border border-border px-3 text-[12px] text-fg hover:bg-surface-2"
          >
            Add
          </button>
        </div>
      )}

      {(fileNames.length > 0 || links.length > 0 || carried.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {carried.map((m, i) => (
            <Chip key={`c${i}`} label={m.type} />
          ))}
          {fileNames.map((n, i) => (
            <Chip key={`f${i}`} label={n} />
          ))}
          {links.map((l, i) => (
            <Chip
              key={`l${i}`}
              label={l.replace(/^https?:\/\/(www\.)?/, '')}
              onRemove={() => setLinks((prev) => prev.filter((x) => x !== l))}
            />
          ))}
        </div>
      )}

      {links.map((l, i) => (
        <input key={i} type="hidden" name="youtubeLinks" value={l} />
      ))}
      {carried.length > 0 && (
        <input type="hidden" name="mediaJson" value={JSON.stringify(carried)} />
      )}
    </div>
  );
}

function IconButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] bg-field/80 text-muted ring-1 ring-white/[0.04] hover:text-fg"
    >
      {children}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="flex max-w-[220px] items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-muted">
      <span className="truncate">{label}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove" className="text-faint hover:text-fg">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
