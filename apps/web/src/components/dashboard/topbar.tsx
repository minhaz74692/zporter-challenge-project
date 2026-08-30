import type { User } from '@zporter/shared';
import { logout } from '@/app/(auth)/actions';
import { IconBell, IconChat, IconDiary, IconSearch } from '@/components/ui/icons';

export function Topbar({ user, crumb }: { user: User; crumb?: string[] }) {
  const initials = user.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const trail = crumb ?? ['Home', 'Challenges'];

  return (
    <header className="flex h-16 items-center justify-between border-b border-border-soft px-6">
      <nav className="flex items-center gap-2 text-[13px] text-muted">
        {trail.map((c, i) => (
          <span key={c} className="flex items-center gap-2">
            {i > 0 && <span className="text-faint">/</span>}
            <span className={i === trail.length - 1 ? 'text-fg' : ''}>{c}</span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-pill)] bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary-hover"
        >
          <IconDiary className="h-4 w-4" />
          Update diary
        </button>
        <div className="flex items-center gap-3 text-muted">
          <IconSearch className="h-[18px] w-[18px] cursor-pointer hover:text-fg" />
          <span className="relative">
            <IconBell className="h-[18px] w-[18px] cursor-pointer hover:text-fg" />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <IconChat className="h-[18px] w-[18px] cursor-pointer hover:text-fg" />
        </div>
        <form action={logout} className="flex items-center gap-2">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-xs font-medium text-fg">{user.displayName}</div>
            <div className="text-[10px] text-faint">{user.handle}</div>
          </div>
          <button
            type="submit"
            title="Sign out"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-surface-2 text-xs font-semibold text-muted ring-1 ring-border transition hover:ring-danger/60"
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
