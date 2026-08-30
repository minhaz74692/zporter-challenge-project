import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

/** Where the interactive UI and the raw spec are served. */
export const SWAGGER_PATH = 'docs';

/**
 * Builds the OpenAPI document from the decorated controllers/DTOs. Kept separate
 * from {@link setupSwagger} so a future `generate-openapi` script can reuse it
 * without mounting the Swagger UI.
 *
 * NOTE: the `@nestjs/swagger` CLI plugin was removed from `nest-cli.json` — on
 * this toolchain (TS 6 + swagger 12.0.1) it emits broken metadata (`enum: string`)
 * that crashes the process at boot. Schemas come from the explicit `@ApiProperty`
 * / class-validator decorators on the DTOs instead.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Zporter Challenges API')
    .setDescription(
      'Backend for the Zporter Challenges slice. The only process that talks to ' +
        'Firebase; Flutter and Next.js consume these endpoints over REST.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  return SwaggerModule.createDocument(app, config);
}

/**
 * Mounts Swagger UI at `/{SWAGGER_PATH}` and the JSON spec at
 * `/{SWAGGER_PATH}-json` (the source of truth for the generated web client).
 */
export function setupSwagger(app: INestApplication): void {
  const document = buildOpenApiDocument(app);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
