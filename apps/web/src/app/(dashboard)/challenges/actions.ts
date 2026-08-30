'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type {
  Challenge,
  ChallengeLocation,
  ChallengeMainCategory,
  ChallengeVisibility,
  CreateChallengeRequest,
  ResultType,
  ResultUnit,
  ScoringDirection,
} from '@zporter/shared';
import { api, ApiError } from '@/lib/api';

export interface CreateState {
  error?: string;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const num = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v === '' ? undefined : Number(v);
};
const iso = (date: string, time: string): string | null => {
  if (!date) return null;
  const d = new Date(`${date}T${time || '00:00'}:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export async function createChallenge(
  _prev: CreateState,
  fd: FormData,
): Promise<CreateState> {
  const startAt = iso(str(fd, 'startDate'), str(fd, 'startTime'));
  const deadline = iso(str(fd, 'endDate'), str(fd, 'endTime'));
  if (!str(fd, 'title')) return { error: 'A headline is required.' };
  if (!startAt || !deadline) return { error: 'Start and end date are required.' };
  if (Date.parse(deadline) <= Date.parse(startAt)) {
    return { error: 'The end must be after the start.' };
  }

  const body: CreateChallengeRequest = {
    templateId: str(fd, 'templateId') || undefined,
    title: str(fd, 'title'),
    ingress: str(fd, 'ingress') || undefined,
    description: str(fd, 'description') || undefined,
    mainCategory: (str(fd, 'mainCategory') as ChallengeMainCategory) || undefined,
    collections: fd.getAll('collections').map(String),
    equipmentTags: fd.getAll('equipmentTags').map(String),
    resultType: (str(fd, 'resultType') as ResultType) || undefined,
    resultUnit: (str(fd, 'resultUnit') as ResultUnit) || undefined,
    scoringDirection: (str(fd, 'scoringDirection') as ScoringDirection) || undefined,
    durationMinutes: num(fd, 'durationMinutes'),
    location: (str(fd, 'location') as ChallengeLocation) || undefined,
    startAt,
    deadline,
    visibility: (str(fd, 'visibility') as ChallengeVisibility) || undefined,
    pointsToParticipate: num(fd, 'pointsToParticipate'),
    rewardPoints: num(fd, 'rewardPoints'),
    minParticipants: num(fd, 'minParticipants'),
    ageFrom: num(fd, 'ageFrom'),
    ageTo: num(fd, 'ageTo'),
    position: str(fd, 'position') || undefined,
  };

  let created: Challenge;
  try {
    created = await api<Challenge>('/challenges', { body });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : 'Could not create the challenge.' };
  }
  redirect(`/challenges/${created.id}`);
}

export interface InviteState {
  error?: string;
  invited?: number;
}

/** Invite the selected players to a challenge (form Server Action). */
export async function invitePlayers(
  _prev: InviteState,
  fd: FormData,
): Promise<InviteState> {
  const challengeId = str(fd, 'challengeId');
  const userIds = fd.getAll('userIds').map(String).filter(Boolean);
  if (!challengeId || userIds.length === 0) {
    return { error: 'Pick at least one player.' };
  }
  try {
    const { invited } = await api<{ invited: number }>(
      `/challenges/${challengeId}/invite`,
      { body: { userIds } },
    );
    revalidatePath(`/challenges/${challengeId}`);
    return { invited };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : 'Could not send invites.' };
  }
}

export interface CoverState {
  error?: string;
  ok?: boolean;
}

/** Upload / replace a challenge cover image (multipart Server Action). */
export async function uploadCover(
  challengeId: string,
  _prev: CoverState,
  fd: FormData,
): Promise<CoverState> {
  const file = fd.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an image first.' };
  }
  const forward = new FormData();
  forward.append('file', file);
  try {
    await api(`/challenges/${challengeId}/cover`, { body: forward });
    revalidatePath(`/challenges/${challengeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : 'Upload failed.' };
  }
}
