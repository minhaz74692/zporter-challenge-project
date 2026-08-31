import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter.js';

function host(url = '/challenges', method = 'GET') {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const argsHost = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url, method }),
    }),
  } as unknown as ArgumentsHost;
  return { argsHost, status, json };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();
  const errSpy = vi.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    errSpy.mockClear();
  });

  it('keeps an HttpException status and produces the uniform error body', () => {
    const { argsHost, status, json } = host('/x');
    filter.catch(new ForbiddenException('nope'), argsHost);

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'nope',
        path: '/x',
        timestamp: expect.any(String),
      }),
    );
  });

  it('passes a class-validator array message through unchanged', () => {
    const { argsHost, json } = host();
    filter.catch(new BadRequestException(['email must be an email', 'password too short']), argsHost);
    expect(json.mock.calls[0][0].message).toEqual([
      'email must be an email',
      'password too short',
    ]);
  });

  it('unwraps a string response payload', () => {
    const { argsHost, json } = host();
    filter.catch(new HttpException('teapot', HttpStatus.I_AM_A_TEAPOT), argsHost);
    expect(json.mock.calls[0][0]).toMatchObject({ statusCode: 418, message: 'teapot' });
  });

  it('maps a non-HttpException to a 500 with a generic message and logs the stack', () => {
    const { argsHost, status, json } = host('/boom', 'POST');

    filter.catch(new Error('db exploded'), argsHost);

    expect(status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0][0]).toMatchObject({
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    expect(errSpy).toHaveBeenCalledOnce();
  });

  it('does not log for a handled HttpException', () => {
    const { argsHost } = host();
    filter.catch(new BadRequestException('bad'), argsHost);
    expect(errSpy).not.toHaveBeenCalled();
  });
});
