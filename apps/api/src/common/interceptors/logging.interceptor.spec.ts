import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor.js';

function httpContext(req: object, res: object): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;
}

const next: CallHandler = { handle: () => of('payload') };

describe('LoggingInterceptor', () => {
  const interceptor = new LoggingInterceptor();

  it('passes non-http contexts straight through without logging', async () => {
    const logSpy = vi.spyOn(interceptor['logger'], 'log').mockImplementation(() => undefined);
    const rpcContext = { getType: () => 'rpc' } as unknown as ExecutionContext;

    const result = await firstValueFrom(interceptor.intercept(rpcContext, next));

    expect(result).toBe('payload');
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('logs one line with method, url and status after the handler completes', async () => {
    const logSpy = vi.spyOn(interceptor['logger'], 'log').mockImplementation(() => undefined);
    const ctx = httpContext(
      { method: 'POST', originalUrl: '/challenges/c1/accept' },
      { statusCode: 200 },
    );

    await firstValueFrom(interceptor.intercept(ctx, next));

    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy.mock.calls[0][0]).toMatch(/^POST \/challenges\/c1\/accept -> 200 \(\d+ms\)$/);
    logSpy.mockRestore();
  });

  it('forwards the handler payload unchanged', async () => {
    vi.spyOn(interceptor['logger'], 'log').mockImplementation(() => undefined);
    const ctx = httpContext({ method: 'GET', originalUrl: '/health' }, { statusCode: 200 });
    expect(await firstValueFrom(interceptor.intercept(ctx, next))).toBe('payload');
  });
});
