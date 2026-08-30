import type { User } from '@zporter/shared';
import { logout } from '@/app/(auth)/actions';
import { Bell, BookMarked, MessageSquare, Search } from 'lucide-react';
import { MobileSidebar } from './mobile-sidebar';

export function Topbar({ user, crumb }: { user: User; crumb?: string[] }) {
  const initials = user.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const trail = crumb ?? ['Home', 'Challenges'];

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border-soft px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileSidebar />
        <nav className="flex items-center gap-2 truncate text-[13px] text-muted">
          {trail.map((c, i) => (
            <span key={c} className="flex items-center gap-2">
              {i > 0 && <span className="text-faint">/</span>}
              <span className={i === trail.length - 1 ? 'text-fg' : ''}>{c}</span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-5 sm:gap-6">
        <button
          type="button"
          className="hidden h-11 items-center gap-2.5 rounded-xl bg-primary px-5 text-[14px] font-bold text-white hover:bg-primary-hover sm:inline-flex"
        >
          <BookMarked className="h-[18px] w-[18px]" />
          Update diary
        </button>
        <div className="hidden items-center gap-6 text-muted sm:flex">
          <Search className="h-[22px] w-[22px] cursor-pointer hover:text-fg" />
          <Bell className="h-[22px] w-[22px] cursor-pointer hover:text-fg" />
          <MessageSquare className="h-[22px] w-[22px] cursor-pointer hover:text-fg" />
        </div>
        <form action={logout} className="flex items-center gap-2.5">
          <div className="hidden text-right leading-tight lg:block">
            <div className="text-xs font-medium text-fg">{user.displayName}</div>
            <div className="text-[10px] text-faint">{user.handle}</div>
          </div>
          <button
            type="submit"
            title="Sign out"
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-surface-2 text-xs font-semibold text-muted ring-1 ring-border transition hover:ring-danger/60"
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </button>
        </form>
      </div>
    </header>
  );
}
