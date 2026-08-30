import { redirect } from 'next/navigation';
import type { User } from '@zporter/shared';
import { api, ApiError } from '@/lib/api';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: User;
  try {
    user = await api<User>('/auth/me');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/login');
    throw e;
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
