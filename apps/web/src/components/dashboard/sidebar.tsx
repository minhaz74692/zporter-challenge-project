import { SidebarNav } from './sidebar-nav';

/** Fixed desktop rail. Below `lg` the drawer in `MobileSidebar` takes over. */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-sidebar lg:block">
      <SidebarNav />
    </aside>
  );
}
