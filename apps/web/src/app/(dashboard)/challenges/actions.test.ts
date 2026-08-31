import { afterEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super(typeof body === 'string' ? body : `err ${status}`);
      this.status = status;
      this.body = body;
      this.name = 'ApiError';
    }
  }
  return {
    ApiError,
    apiMock: vi.fn(),
    redirect: vi.fn((to: string) => {
      throw new Error(`REDIRECT:${to}`);
    }),
    revalidatePath: vi.fn(),
  };
});
const { ApiError, apiMock, revalidatePath } = h;

vi.mock('@/lib/api', () => ({ api: h.apiMock, ApiError: h.ApiError }));
vi.mock('next/navigation', () => ({ redirect: h.redirect }));
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }));

import {
  createChallenge,
  deleteChallenge,
  invitePlayers,
  updateChallenge,
  uploadCover,
} from './actions';

afterEach(() => vi.clearAllMocks());

function challengeForm(over: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, string> = {
    title: 'Sprint Test',
    startDate: '2026-01-01',
    startTime: '09:00',
    endDate: '2026-02-01',
    endTime: '10:00',
    mainCategory: 'physical',
    resultType: 'time',
    durationMinutes: '10',
    rewardPoints: '',
  };
  for (const [k, v] of Object.entries({ ...base, ...over })) {
    if (v !== '') fd.append(k, v);
  }
  return fd;
}

describe('createChallenge', () => {
  it('requires a headline', async () => {
    const fd = challengeForm();
    fd.delete('title');
    expect(await createChallenge({}, fd)).toEqual({ error: 'A headline is required.' });
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('requires both a start and an end date', async () => {
    const fd = challengeForm();
    fd.delete('endDate');
    expect(await createChallenge({}, fd)).toEqual({
      error: 'Start and end date are required.',
    });
  });

  it('rejects an end that is not after the start', async () => {
    const fd = challengeForm({ endDate: '2026-01-01', endTime: '09:00' });
    expect(await createChallenge({}, fd)).toEqual({ error: 'The end must be after the start.' });
  });

  it('POSTs an ISO-dated body and redirects to the new challenge', async () => {
    apiMock.mockResolvedValue({ id: 'c-new' });
    await expect(createChallenge({}, challengeForm())).rejects.toThrow('REDIRECT:/challenges/c-new');

    const [path, opts] = apiMock.mock.calls[0];
    expect(path).toBe('/challenges');
    expect(opts.body.startAt).toBe(new Date('2026-01-01T09:00:00').toISOString());
    expect(opts.body.deadline).toBe(new Date('2026-02-01T10:00:00').toISOString());
    expect(opts.body.durationMinutes).toBe(10);
  });

  it('omits blank numeric fields rather than sending NaN', async () => {
    apiMock.mockResolvedValue({ id: 'c-new' });
    await expect(createChallenge({}, challengeForm())).rejects.toThrow();
    expect(apiMock.mock.calls[0][1].body.rewardPoints).toBeUndefined();
  });

  it('collects repeated collections / equipmentTags / invitedUserIds entries', async () => {
    apiMock.mockResolvedValue({ id: 'c-new' });
    const fd = challengeForm();
    fd.append('collections', 'Speed');
    fd.append('collections', 'Power');
    fd.append('equipmentTags', '#Cones');
    fd.append('invitedUserIds', 'p1');
    fd.append('invitedUserIds', '');

    await expect(createChallenge({}, fd)).rejects.toThrow();
    const body = apiMock.mock.calls[0][1].body;
    expect(body.collections).toEqual(['Speed', 'Power']);
    expect(body.equipmentTags).toEqual(['#Cones']);
    expect(body.invitedUserIds).toEqual(['p1']);
  });

  it('returns the ApiError message on failure', async () => {
    apiMock.mockRejectedValue(new ApiError(403, 'Only admins may publish to all'));
    expect(await createChallenge({}, challengeForm())).toEqual({
      error: 'Only admins may publish to all',
    });
  });
});

describe('updateChallenge', () => {
  it('PATCHes the bound id, strips templateId/invitedUserIds, then revalidates + redirects', async () => {
    apiMock.mockResolvedValue({});
    const fd = challengeForm();
    fd.append('templateId', 'tpl-1');
    fd.append('invitedUserIds', 'p1');

    await expect(updateChallenge('c-7', {}, fd)).rejects.toThrow('REDIRECT:/challenges/c-7');

    const [path, opts] = apiMock.mock.calls[0];
    expect(path).toBe('/challenges/c-7');
    expect(opts.method).toBe('PATCH');
    expect(opts.body.templateId).toBeUndefined();
    expect(opts.body.invitedUserIds).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith('/challenges/c-7');
  });

  it('applies the same validation as create', async () => {
    const fd = challengeForm();
    fd.delete('title');
    expect(await updateChallenge('c-7', {}, fd)).toEqual({ error: 'A headline is required.' });
  });

  it('returns the ApiError message and does not redirect', async () => {
    apiMock.mockRejectedValue(new ApiError(404, 'Challenge not found'));
    expect(await updateChallenge('c-7', {}, challengeForm())).toEqual({
      error: 'Challenge not found',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('deleteChallenge', () => {
  it('DELETEs, revalidates the list and redirects to it', async () => {
    apiMock.mockResolvedValue(undefined);
    await expect(deleteChallenge('c-7')).rejects.toThrow('REDIRECT:/challenges');
    expect(apiMock).toHaveBeenCalledWith('/challenges/c-7', { method: 'DELETE' });
    expect(revalidatePath).toHaveBeenCalledWith('/challenges');
  });

  it('still redirects when the API call fails', async () => {
    apiMock.mockRejectedValue(new Error('boom'));
    await expect(deleteChallenge('c-7')).rejects.toThrow('REDIRECT:/challenges');
    expect(revalidatePath).toHaveBeenCalledWith('/challenges');
  });
});

describe('invitePlayers', () => {
  function inviteForm(ids: string[], challengeId = 'c-7'): FormData {
    const fd = new FormData();
    if (challengeId) fd.append('challengeId', challengeId);
    for (const id of ids) fd.append('userIds', id);
    return fd;
  }

  it('requires a challenge id and at least one player', async () => {
    expect(await invitePlayers({}, inviteForm([]))).toEqual({ error: 'Pick at least one player.' });
    expect(await invitePlayers({}, inviteForm(['p1'], ''))).toEqual({
      error: 'Pick at least one player.',
    });
  });

  it('sends the invite and returns the invited count', async () => {
    apiMock.mockResolvedValue({ invited: 3 });
    const state = await invitePlayers({}, inviteForm(['p1', 'p2', '']));

    expect(apiMock).toHaveBeenCalledWith('/challenges/c-7/invite', { body: { userIds: ['p1', 'p2'] } });
    expect(revalidatePath).toHaveBeenCalledWith('/challenges/c-7');
    expect(state).toEqual({ invited: 3 });
  });

  it('returns the ApiError message on failure', async () => {
    apiMock.mockRejectedValue(new ApiError(403, 'Not your challenge'));
    expect(await invitePlayers({}, inviteForm(['p1']))).toEqual({ error: 'Not your challenge' });
  });
});

describe('uploadCover', () => {
  function coverForm(file: File | null): FormData {
    const fd = new FormData();
    if (file) fd.append('file', file);
    return fd;
  }

  it('requires a non-empty image file', async () => {
    expect(await uploadCover('c-7', {}, coverForm(null))).toEqual({ error: 'Choose an image first.' });
    const empty = new File([], 'a.png', { type: 'image/png' });
    expect(await uploadCover('c-7', {}, coverForm(empty))).toEqual({
      error: 'Choose an image first.',
    });
  });

  it('forwards the file as multipart form data and reports success', async () => {
    apiMock.mockResolvedValue(undefined);
    const file = new File([new Uint8Array([1, 2, 3])], 'cover.png', { type: 'image/png' });

    const state = await uploadCover('c-7', {}, coverForm(file));

    const [path, opts] = apiMock.mock.calls[0];
    expect(path).toBe('/challenges/c-7/cover');
    expect(opts.body).toBeInstanceOf(FormData);
    expect((opts.body as FormData).get('file')).toBeInstanceOf(File);
    expect(revalidatePath).toHaveBeenCalledWith('/challenges/c-7');
    expect(state).toEqual({ ok: true });
  });

  it('returns the ApiError message on upload failure', async () => {
    apiMock.mockRejectedValue(new ApiError(400, 'Unsupported media type'));
    const file = new File([new Uint8Array([1])], 'c.png', { type: 'image/png' });
    expect(await uploadCover('c-7', {}, coverForm(file))).toEqual({
      error: 'Unsupported media type',
    });
  });
});
