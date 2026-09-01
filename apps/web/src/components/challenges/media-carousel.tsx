'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { MediaItem } from '@zporter/shared';
import { cn } from '@/components/ui/cn';

/** `https://img.youtube.com/vi/<id>/hqdefault.jpg` id → embed URL. */
function youtubeEmbed(watchUrl: string): string | null {
  try {
    const u = new URL(watchUrl);
    const id = u.searchParams.get('v') ?? u.pathname.split('/').filter(Boolean).pop();
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

/**
 * Swipeable challenge media gallery: horizontal scroll-snap track + dots.
 * Images use `next/image`; videos get native controls; YouTube items embed
 * (detail) so the reader never leaves the page.
 */
export function MediaCarousel({
  items,
  priority = false,
  interactive = true,
  className,
}: {
  items: MediaItem[];
  priority?: boolean;
  /** false on the card: video / YouTube slides render as a static poster. */
  interactive?: boolean;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className={cn('relative aspect-[2/1] w-full overflow-hidden bg-surface-2', className)}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div key={item.url + i} className="relative h-full w-full shrink-0 snap-center">
            <Slide item={item} priority={priority && i === 0} interactive={interactive} />
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                i === active ? 'bg-success' : 'bg-white/40',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Slide({
  item,
  priority,
  interactive,
}: {
  item: MediaItem;
  priority: boolean;
  interactive: boolean;
}) {
  if (item.type === 'image') {
    return (
      <Image
        src={item.url}
        alt="Challenge media"
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className="object-cover"
        priority={priority}
      />
    );
  }

  // Card preview: a static poster with a play glyph, no iframe/controls.
  if (!interactive) {
    return (
      <div className="relative h-full w-full bg-black">
        {item.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnailUrl} alt="Video" className="h-full w-full object-cover opacity-90" />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <Play className="h-10 w-10 text-white drop-shadow" fill="currentColor" />
        </span>
      </div>
    );
  }

  if (item.type === 'video') {
    return (
      <video
        src={item.url}
        poster={item.thumbnailUrl}
        controls
        preload="metadata"
        className="h-full w-full bg-black object-cover"
      >
        <track kind="captions" />
      </video>
    );
  }

  const embed = youtubeEmbed(item.url);
  if (embed) {
    return (
      <iframe
        src={embed}
        title="YouTube video"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full bg-black"
      />
    );
  }

  // Unparseable link — show the thumbnail as an outbound link.
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="block h-full w-full">
      {item.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnailUrl} alt="Video" className="h-full w-full object-cover" />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <Play className="h-10 w-10 text-white drop-shadow" />
      </span>
    </a>
  );
}
