import Image from 'next/image';
import type { ReactNode } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/components/ui/cn';

/**
 * Challenge cover: photo (or a neutral placeholder), a bottom scrim, and an
 * optional centered headline / ingress over it. `topLeft` / `topRight` are free
 * slots for badges. Reused by the card grid and the detail header.
 */
export function CoverHeader({
  src,
  title,
  subtitle,
  topLeft,
  topRight,
  priority = false,
  className,
}: {
  src?: string;
  title?: string;
  subtitle?: string;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative aspect-[2/1] w-full overflow-hidden bg-surface-2',
        className,
      )}
    >
      {src ? (
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
