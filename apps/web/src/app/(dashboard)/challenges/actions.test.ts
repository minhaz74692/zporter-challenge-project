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
  addChallengeMedia,
  createChallenge,
  deleteChallenge,
  invitePlayers,
  removeChallengeMedia,
  reorderChallengeMedia,
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

describe('media on create / update', () => {
  const png = () => new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' });

  it('createChallenge uploads files + youtube links to /media after the challenge exists', async () => {
    apiMock.mockResolvedValue({ id: 'c-new' });
    const fd = challengeForm();
    fd.append('mediaFiles', png());
    fd.append('youtubeLinks', 'https://youtu.be/b1Dp2Yl3ARw');
    fd.append('youtubeLinks', '  ');

    await expect(createChallenge({}, fd)).rejects.toThrow('REDIRECT:/challenges/c-new');

    expect(apiMock.mock.calls[0][0]).toBe('/challenges');
    const [mediaPath, mediaOpts] = apiMock.mock.calls[1];
    expect(mediaPath).toBe('/challenges/c-new/media');
    expect(mediaOpts.body).toBeInstanceOf(FormData);
    expect((mediaOpts.body as FormData).getAll('files')).toHaveLength(1);
    expect((mediaOpts.body as FormData).getAll('youtubeLinks')).toEqual([
      'https://youtu.be/b1Dp2Yl3ARw',
    ]);
  });

  it('createChallenge re-sends a copied gallery as JSON via mediaJson', async () => {
    apiMock.mockResolvedValue({ id: 'c-new' });
    const fd = challengeForm();
    fd.append('mediaJson', JSON.stringify([{ url: 'u', type: 'image' }]));

    await expect(createChallenge({}, fd)).rejects.toThrow();
    const [path, opts] = apiMock.mock.calls[1];
    expect(path).toBe('/challenges/c-new/media');
    expect(opts.method).toBe('PUT');
    expect(opts.body).toEqual({ items: [{ url: 'u', type: 'image' }] });
  });

  it('createChallenge still redirects (with ?media=failed) when the upload fails', async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === '/challenges') return Promise.resolve({ id: 'c-new' });
      return Promise.reject(new Error('storage down'));
    });
    const fd = challengeForm();
    fd.append('mediaFiles', png());
    await expect(createChallenge({}, fd)).rejects.toThrow('REDIRECT:/challenges/c-new?media=failed');
  });

  it('does not call /media when the form carries no media', async () => {
    apiMock.mockResolvedValue({ id: 'c-new' });
    await expect(createChallenge({}, challengeForm())).rejects.toThrow('REDIRECT:/challenges/c-new');
    expect(apiMock).toHaveBeenCalledTimes(1);
  });
});

describe('detail-page media actions', () => {
  it('addChallengeMedia forwards files + links as multipart', async () => {
    apiMock.mockResolvedValue({ id: 'c-7' });
    const fd = new FormData();
    fd.append('mediaFiles', new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }));
    fd.append('youtubeLinks', 'https://youtu.be/b1Dp2Yl3ARw');

    expect(await addChallengeMedia('c-7', {}, fd)).toEqual({ ok: true });
    const [path, opts] = apiMock.mock.calls[0];
    expect(path).toBe('/challenges/c-7/media');
    expect(opts.body).toBeInstanceOf(FormData);
    expect(revalidatePath).toHaveBeenCalledWith('/challenges/c-7');
  });

  it('addChallengeMedia rejects an empty submission', async () => {
    expect(await addChallengeMedia('c-7', {}, new FormData())).toEqual({
      error: 'Choose a file or paste a YouTube link.',
    });
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('removeChallengeMedia DELETEs by index and revalidates', async () => {
    apiMock.mockResolvedValue({});
    await removeChallengeMedia('c-7', 2);
    expect(apiMock).toHaveBeenCalledWith('/challenges/c-7/media/2', { method: 'DELETE' });
    expect(revalidatePath).toHaveBeenCalledWith('/challenges/c-7');
  });

  it('reorderChallengeMedia PUTs the new item order', async () => {
    apiMock.mockResolvedValue({});
    const items = [
      { url: 'b', type: 'image' as const },
      { url: 'a', type: 'youtube' as const },
    ];
    await reorderChallengeMedia('c-7', items);
    expect(apiMock).toHaveBeenCalledWith('/challenges/c-7/media', {
      method: 'PUT',
      body: { items },
    });
  });
});
