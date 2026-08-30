import type { Team } from '@zporter/shared';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';

export default async function TeamsPage() {
  const teams = await api<Team[]>('/teams');

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-fg">Your squads</h1>
        <p className="text-xs text-muted">
          Seed-backed for now — invite a whole squad from the challenge form.
        </p>
      </div>
      <div className="space-y-3">
        {teams.map((t) => (
          <Card key={t.id} className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-fg">{t.name}</span>
            <span className="text-xs text-faint">{t.id}</span>
          </Card>
        ))}
        {teams.length === 0 && (
          <Card className="py-8 text-center text-sm text-muted">No squads yet.</Card>
        )}
      </div>
    </div>
  );
}
