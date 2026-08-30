import type { Participant } from '@zporter/shared';
import { proxyGet } from '@/lib/proxy';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyGet<Participant[]>(`/challenges/${id}/participants`);
}
