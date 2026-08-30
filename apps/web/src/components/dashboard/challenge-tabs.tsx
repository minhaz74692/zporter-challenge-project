'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';
import { IconFilter, IconSearch } from '@/components/ui/icons';

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
      <div className="flex gap-7 text-[13px]">
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
      <div className="mt-3 flex items-center justify-between pb-3">
        <div className="flex items-center gap-6 text-[13px]">
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
        <div className="flex items-center gap-4 text-muted">
          {typeof count === 'number' && (
            <span className="text-[13px] font-semibold text-success">{count} Challenges</span>
          )}
          <IconSearch className="h-[18px] w-[18px]" />
          <IconFilter className="h-[18px] w-[18px]" />
        </div>
      </div>
    </div>
  );
}
