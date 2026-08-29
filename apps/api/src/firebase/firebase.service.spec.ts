import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const initializeApp = vi.fn(() => ({ name: 'zporter-api' }));
const cert = vi.fn((v: unknown) => ({ kind: 'cert', v }));
const applicationDefault = vi.fn(() => ({ kind: 'adc' }));
const getApps = vi.fn(() => [] as { name: string }[]);
const deleteApp = vi.fn(async () => undefined);
const firestoreSettings = vi.fn();

vi.mock('firebase-admin/app', () => ({
  initializeApp,
  cert,
  applicationDefault,
  getApps,
  deleteApp,
}));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({ settings: firestoreSettings })),
}));
vi.mock('firebase-admin/messaging', () => ({ getMessaging: vi.fn(() => ({})) }));

const { FirebaseService } = await import('./firebase.service.js');

function configWith(firebase: Record<string, unknown>): ConfigService {
  return { getOrThrow: vi.fn(() => firebase) } as unknown as ConfigService;
}

describe('FirebaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getApps.mockReturnValue([]);
  });

  it('uses a service-account cert when an inline key is provided', () => {
    const key = JSON.stringify({ type: 'service_account', project_id: 'p' });
    new FirebaseService(configWith({ projectId: 'p', serviceAccountKey: key }));

    expect(cert).toHaveBeenCalledWith(expect.objectContaining({ project_id: 'p' }));
    expect(applicationDefault).not.toHaveBeenCalled();
  });

  it('decodes a base64 inline key', () => {
    const key = Buffer.from(
      JSON.stringify({ type: 'service_account', project_id: 'p' }),
    ).toString('base64');
    new FirebaseService(configWith({ projectId: 'p', serviceAccountKey: key }));

    expect(cert).toHaveBeenCalledWith(expect.objectContaining({ project_id: 'p' }));
  });

  it('passes a credentials path straight to cert()', () => {
    new FirebaseService(configWith({ projectId: 'p', credentialsPath: '/k.json' }));
    expect(cert).toHaveBeenCalledWith('/k.json');
  });

  it('falls back to Application Default Credentials when nothing is set', () => {
    new FirebaseService(configWith({ projectId: 'p' }));
    expect(applicationDefault).toHaveBeenCalledOnce();
  });

  it('reuses an already-initialised admin app', () => {
    getApps.mockReturnValue([{ name: 'zporter-api' }]);
    new FirebaseService(configWith({ projectId: 'p' }));
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('throws on an unparseable inline key', () => {
    expect(
      () => new FirebaseService(configWith({ projectId: 'p', serviceAccountKey: 'not-json' })),
    ).toThrow(/not valid JSON/);
  });
});
