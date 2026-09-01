import Image from 'next/image';
import type { ReactNode } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { MediaItem } from '@zporter/shared';
import { cn } from '@/components/ui/cn';
import { MediaCarousel } from './media-carousel';

/**
 * Challenge cover: a single photo, a swipeable {@link MediaCarousel} when the
 * challenge has more than one media item, or a neutral placeholder — plus a
 * bottom scrim and an optional centered headline / ingress. `topLeft` /
 * `topRight` are free slots for badges. Reused by the card grid and the detail
 * header.
 */
export function CoverHeader({
  src,
  media,
  title,
  subtitle,
  topLeft,
  topRight,
  priority = false,
  interactiveMedia = true,
  /** Aspect ratio of the frame. Card = wide 2:1; detail passes 16:9 so an
   *  embedded YouTube player has room for its own chrome. */
  ratioClassName = 'aspect-[2/1]',
  className,
}: {
  src?: string;
  media?: MediaItem[];
  title?: string;
  subtitle?: string;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  priority?: boolean;
  /** false inside a card `<Link>`: video / YouTube slides stay static posters. */
  interactiveMedia?: boolean;
  ratioClassName?: string;
  className?: string;
}) {
  const gallery = media && media.length > 1 ? media : null;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-surface-2',
        ratioClassName,
        className,
      )}
    >
      {gallery ? (
        <MediaCarousel
          items={gallery}
          priority={priority}
          interactive={interactiveMedia}
          className="absolute inset-0 aspect-auto"
        />
      ) : src ? (
        <Image
          src={src}
          alt={title ?? 'Challenge cover'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
          priority={priority}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-9 w-9 text-faint" strokeWidth={1.5} />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {topLeft && <div className="absolute left-3 top-3">{topLeft}</div>}
      {topRight && <div className="absolute right-3 top-3">{topRight}</div>}

      {(title || subtitle) && (
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-8 text-center">
          {title && (
            <h3 className="line-clamp-1 text-[16px] font-bold text-white drop-shadow-sm">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mx-auto mt-1 line-clamp-2 max-w-[92%] text-[12px] leading-snug text-white/70">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
