'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';
import { SlidersHorizontal, Search } from 'lucide-react';

const TOP = ['Sessions', 'Exercises', 'Challenges'];
const SUB = [
  { label: 'Saved', href: '/templates' },
  { label: 'Yours', href: '/challenges' },
  { label: 'Physical', href: null },
  { label: 'Technical', href: null },
];

export function ChallengeTabs({ count }: { count?: number }) {
  const pathname = usePathname();
  const onOwn = pathname === '/challenges' || pathname.startsWith('/challenges/');

  return (
    <div className="mb-6 border-b border-border-soft">
      <div className="flex gap-7 overflow-x-auto text-[13px]">
        {TOP.map((t) => (
          <span
            key={t}
            className={cn(
              'pb-2',
              t === 'Challenges'
                ? 'border-b-2 border-accent font-medium text-accent'
                : 'cursor-default text-faint',
            )}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-6 overflow-x-auto text-[13px]">
          {SUB.map((s) => {
            const active = s.href === '/challenges' ? onOwn : pathname.startsWith(s.href ?? '###');
            return s.href ? (
              <Link
                key={s.label}
                href={s.href}
                className={cn(
                  'pb-1',
                  active
                    ? 'border-b-2 border-accent font-medium text-accent'
                    : 'text-muted hover:text-fg',
                )}
              >
                {s.label}
              </Link>
            ) : (
              <span key={s.label} className="cursor-default text-faint">
                {s.label}
              </span>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-4 text-muted">
          {typeof count === 'number' && (
            <span className="hidden text-[13px] font-semibold text-success sm:inline">
              {count} Challenges
            </span>
          )}
          <Search className="h-[18px] w-[18px]" />
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </div>
      </div>
    </div>
  );
}
