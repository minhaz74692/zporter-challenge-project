import Link from 'next/link';
import type { ChallengeTemplate } from '@zporter/shared';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Button } from '@/components/ui/button';

export default async function TemplatesPage() {
  const templates = await api<ChallengeTemplate[]>('/templates');

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-fg">Template library</h1>
        <p className="text-xs text-muted">{templates.length} reusable challenge blueprints</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} className="flex h-full flex-col">
            <h3 className="text-sm font-semibold text-fg">{t.title}</h3>
            {t.ingress && <p className="mt-1 line-clamp-2 text-xs text-muted">{t.ingress}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pill tone="accent" className="capitalize">
                {t.mainCategory}
              </Pill>
              <Pill tone="skill">
                {t.resultType} · {t.resultUnit}
              </Pill>
            </div>
            <div className="mt-auto pt-4">
              <Link href={`/challenges/new?template=${t.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Copy to new challenge
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
