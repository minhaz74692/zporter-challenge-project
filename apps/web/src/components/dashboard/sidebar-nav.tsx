'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlarmClockPlus,
  AlignJustify,
  CircleAlert,
  ContactRound,
  Dumbbell,
  House,
  MessagesSquare,
  Trophy,
} from 'lucide-react';
import { cn } from '@/components/ui/cn';
import { QrMark } from './qr-mark';

const PRIMARY = [
  { label: 'Feed', icon: AlignJustify, href: null },
  { label: 'Dashboard', icon: House, href: null },
  { label: 'Test', icon: Dumbbell, href: null },
  { label: 'Programs', icon: AlarmClockPlus, href: null },
  { label: 'Challenges', icon: Trophy, href: '/challenges' as const },
  { label: 'Contact', icon: MessagesSquare, href: null },
  { label: 'Biography', icon: ContactRound, href: null },
  { label: 'Support', icon: CircleAlert, href: null },
] as const;

const SUB = [
  { label: 'Your challenges', href: '/challenges' },
  { label: 'Template library', href: '/templates' },
  { label: 'Teams', href: '/teams' },
] as const;

/** Shared inner content for both the desktop rail and the mobile drawer. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const inChallenges =
    pathname === '/challenges' ||
    pathname.startsWith('/challenges/') ||
    pathname.startsWith('/templates') ||
    pathname.startsWith('/teams');

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-8 pt-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Zporter" className="h-7 w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto px-4">
        <ul className="space-y-1">
          {PRIMARY.map(({ label, icon: Icon, href }) => {
            const active = !!href && inChallenges && label === 'Challenges';
            const cls = cn(
              'flex items-center gap-4 rounded-[var(--radius-control)] px-3 py-3 text-[15px] transition-colors',
              active
                ? 'bg-white/5 font-medium text-fg'
                : href
                  ? 'text-muted hover:bg-white/5 hover:text-fg'
                  : 'cursor-default text-muted/70',
            );
            const inner = (
              <>
                <Icon className="h-[22px] w-[22px] shrink-0" />
                <span>{label}</span>
              </>
            );
            return (
              <li key={label}>
                {href ? (
                  <Link href={href} className={cls} onClick={onNavigate}>
                    {inner}
                  </Link>
                ) : (
                  <span className={cls} aria-disabled>
                    {inner}
                  </span>
                )}

                {active && (
                  <ul className="mb-1 mt-1 ml-[34px] space-y-0.5 border-l border-white/10 pl-3">
                    {SUB.map((s) => {
                      const subActive =
                        pathname === s.href ||
                        (s.href !== '/challenges' && pathname.startsWith(s.href));
                      return (
                        <li key={s.href}>
                          <Link
                            href={s.href}
                            onClick={onNavigate}
                            className={cn(
                              'block rounded-[var(--radius-control)] px-3 py-1.5 text-[13px] transition-colors',
                              subActive ? 'text-accent' : 'text-muted hover:text-fg',
                            )}
                          >
                            {s.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 border-t border-white/[0.06] px-6 py-7 text-center">
        <QrMark className="mx-auto h-[76px] w-[76px]" />
        <a
          href="https://zporter.co"
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-[12px] leading-snug text-muted underline underline-offset-2 hover:text-fg"
        >
          Zporter Apps for
          <br />
          Smartphones &amp; Tablets
        </a>
      </div>
    </div>
  );
}
