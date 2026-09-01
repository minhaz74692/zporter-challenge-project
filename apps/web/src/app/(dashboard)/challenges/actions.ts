'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type {
  Challenge,
  ChallengeLocation,
  ChallengeMainCategory,
  ChallengeVisibility,
  CreateChallengeRequest,
  MediaItem,
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
  const body = readChallengeBody(fd);
  if (!body.title) return { error: 'A headline is required.' };
  if (!body.startAt || !body.deadline) return { error: 'Start and end date are required.' };
  if (Date.parse(body.deadline) <= Date.parse(body.startAt)) {
    return { error: 'The end must be after the start.' };
  }

  let created: Challenge;
  try {
    created = await api<Challenge>('/challenges', { body });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : 'Could not create the challenge.' };
  }

  // Media can only be attached once the challenge (and its id) exists.
  const mediaOk = await attachFormMedia(created.id, fd);
  redirect(mediaOk ? `/challenges/${created.id}` : `/challenges/${created.id}?media=failed`);
}

/**
 * Upload the create/edit form's media — `mediaFiles` (File[]) + `youtubeLinks`
 * (string[]) — plus any `mediaJson` carried from a "copy". Returns false if a
 * call failed; the challenge itself is untouched either way.
 */
async function attachFormMedia(challengeId: string, fd: FormData): Promise<boolean> {
  const files = fd.getAll('mediaFiles').filter((f): f is File => f instanceof File && f.size > 0);
  const links = fd.getAll('youtubeLinks').map(String).map((s) => s.trim()).filter(Boolean);
  const carried = str(fd, 'mediaJson');

  try {
    if (carried) {
      const items = JSON.parse(carried) as MediaItem[];
      if (Array.isArray(items) && items.length > 0) {
        await api(`/challenges/${challengeId}/media`, { method: 'PUT', body: { items } });
      }
    }
    if (files.length > 0 || links.length > 0) {
      const forward = new FormData();
      files.forEach((f) => forward.append('files', f));
      links.forEach((l) => forward.append('youtubeLinks', l));
      await api(`/challenges/${challengeId}/media`, { body: forward });
    }
    return true;
  } catch {
    return false;
  }
}

/** Build the `CreateChallengeRequest`-shaped body the challenge form submits. */
function readChallengeBody(fd: FormData): CreateChallengeRequest {
  const startAt = iso(str(fd, 'startDate'), str(fd, 'startTime'));
  const deadline = iso(str(fd, 'endDate'), str(fd, 'endTime'));
  return {
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
    startAt: startAt ?? '',
    deadline: deadline ?? '',
    visibility: (str(fd, 'visibility') as ChallengeVisibility) || undefined,
    pointsToParticipate: num(fd, 'pointsToParticipate'),
    rewardPoints: num(fd, 'rewardPoints'),
    minParticipants: num(fd, 'minParticipants'),
    ageFrom: num(fd, 'ageFrom'),
    ageTo: num(fd, 'ageTo'),
    position: str(fd, 'position') || undefined,
    invitedUserIds: fd.getAll('invitedUserIds').map(String).filter(Boolean),
  };
}

/** Edit an existing challenge (owner/admin). Bound with the id by the edit page. */
export async function updateChallenge(
  challengeId: string,
  _prev: CreateState,
  fd: FormData,
): Promise<CreateState> {
  const body = readChallengeBody(fd);
  if (!body.title) return { error: 'A headline is required.' };
  if (!body.startAt || !body.deadline) return { error: 'Start and end date are required.' };
  if (Date.parse(body.deadline) <= Date.parse(body.startAt)) {
    return { error: 'The end must be after the start.' };
  }
  delete body.templateId;
  delete body.invitedUserIds;

  try {
    await api(`/challenges/${challengeId}`, { method: 'PATCH', body });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : 'Could not save the challenge.' };
  }
  const mediaOk = await attachFormMedia(challengeId, fd);
  revalidatePath(`/challenges/${challengeId}`);
  redirect(mediaOk ? `/challenges/${challengeId}` : `/challenges/${challengeId}?media=failed`);
}

export interface MediaState {
  error?: string;
  ok?: boolean;
}

/** Add media on the detail-page manager (multipart Server Action). */
export async function addChallengeMedia(
  challengeId: string,
  _prev: MediaState,
  fd: FormData,
): Promise<MediaState> {
  const files = fd.getAll('mediaFiles').filter((f): f is File => f instanceof File && f.size > 0);
  const links = fd.getAll('youtubeLinks').map(String).map((s) => s.trim()).filter(Boolean);
  if (files.length === 0 && links.length === 0) {
    return { error: 'Choose a file or paste a YouTube link.' };
  }
  const forward = new FormData();
  files.forEach((f) => forward.append('files', f));
  links.forEach((l) => forward.append('youtubeLinks', l));
  try {
    await api(`/challenges/${challengeId}/media`, { body: forward });
    revalidatePath(`/challenges/${challengeId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : 'Upload failed.' };
  }
}

/** Remove one gallery item by index (detail-page manager). */
export async function removeChallengeMedia(
  challengeId: string,
  index: number,
): Promise<void> {
  try {
    await api(`/challenges/${challengeId}/media/${index}`, { method: 'DELETE' });
  } catch {
    // ignore — the page re-fetches and reflects reality
  }
  revalidatePath(`/challenges/${challengeId}`);
}

/** Replace / reorder the whole gallery (detail-page manager). */
export async function reorderChallengeMedia(
  challengeId: string,
  items: MediaItem[],
): Promise<void> {
  try {
    await api(`/challenges/${challengeId}/media`, { method: 'PUT', body: { items } });
  } catch {
    // ignore
  }
  revalidatePath(`/challenges/${challengeId}`);
}

/** Delete a challenge (owner/admin). Bound with the id; used as a `<form action>`. */
export async function deleteChallenge(challengeId: string): Promise<void> {
  try {
    await api(`/challenges/${challengeId}`, { method: 'DELETE' });
  } catch {
    // ignore — redirect to the list either way; it reflects reality
  }
  revalidatePath('/challenges');
  redirect('/challenges');
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
