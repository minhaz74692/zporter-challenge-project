import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';
import { LoggingInterceptor } from './interceptors/logging.interceptor.js';

/**
 * App-wide HTTP cross-cutting concerns, registered once here so feature modules
 * stay focused on their domain:
 *  - `ValidationPipe` — DTOs validated + whitelisted (unknown keys rejected),
 *    payloads transformed to their class instances.
 *  - `HttpExceptionFilter` — single error response shape.
 *  - `LoggingInterceptor` — one log line per request.
 */
@Module({
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class CommonModule {}
