'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';
import {
  IconBiography,
  IconChallenges,
  IconContact,
  IconDashboard,
  IconFeed,
  IconPrograms,
  IconSupport,
  IconTest,
} from '@/components/ui/icons';

const PRIMARY = [
  { label: 'Feed', icon: IconFeed, href: null },
  { label: 'Dashboard', icon: IconDashboard, href: null },
  { label: 'Test', icon: IconTest, href: null },
  { label: 'Programs', icon: IconPrograms, href: null },
  { label: 'Challenges', icon: IconChallenges, href: '/challenges' as const },
  { label: 'Contact', icon: IconContact, href: null },
  { label: 'Biography', icon: IconBiography, href: null },
  { label: 'Support', icon: IconSupport, href: null },
];

const SUB = [
  { label: 'Your challenges', href: '/challenges' },
  { label: 'Template library', href: '/templates' },
  { label: 'Teams', href: '/teams' },
];

export function Sidebar() {
  const pathname = usePathname();
  const inChallenges =
    pathname === '/challenges' ||
    pathname.startsWith('/challenges/') ||
    pathname.startsWith('/templates') ||
    pathname.startsWith('/teams');

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border-soft bg-sidebar lg:flex">
      <div className="px-6 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Zporter" className="h-6 w-auto" />
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {PRIMARY.map(({ label, icon: Icon, href }) => {
          const active = href ? inChallenges && label === 'Challenges' : false;
          const cls = cn(
            'flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-[13px] transition-colors',
            active
              ? 'bg-surface-2 font-medium text-fg'
              : href
                ? 'text-muted hover:bg-surface-2 hover:text-fg'
                : 'cursor-default text-faint',
          );
          const inner = (
            <>
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{label}</span>
            </>
          );
          return href ? (
            <Link key={label} href={href} className={cls}>
              {inner}
            </Link>
          ) : (
            <span key={label} className={cls} aria-disabled>
              {inner}
            </span>
          );
        })}

        {inChallenges && (
          <div className="mt-2 space-y-0.5 border-l border-border-soft pl-3 ml-6">
            {SUB.map((s) => {
              const active =
                pathname === s.href || (s.href !== '/challenges' && pathname.startsWith(s.href));
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className={cn(
                    'block rounded-[var(--radius-control)] px-3 py-1.5 text-[12px] transition-colors',
                    active ? 'text-accent' : 'text-muted hover:text-fg',
                  )}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="px-6 py-6">
        <div className="grid h-14 w-14 grid-cols-3 grid-rows-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={cn('rounded-[2px]', [0, 2, 4, 6, 8].includes(i) ? 'bg-muted' : 'bg-surface-3')}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-tight text-faint">
          Zporter Apps for
          <br />
          Smartphones &amp; Tablets
        </p>
      </div>
    </aside>
  );
}
