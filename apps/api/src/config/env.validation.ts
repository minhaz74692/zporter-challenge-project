import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/**
 * Shape + rules for `process.env`. Validated once at boot so a misconfigured
 * environment is a startup crash, not a first-request 500.
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  FIREBASE_PROJECT_ID!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  /** `expiresIn` string for the access token (e.g. `15m`, `1h`). */
  @IsString()
  @IsOptional()
  JWT_ACCESS_TTL: string = '15m';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  JWT_REFRESH_TTL_DAYS: number = 14;

  /** Absolute/relative path to a service-account JSON key (local dev). */
  @IsString()
  @IsOptional()
  GOOGLE_APPLICATION_CREDENTIALS?: string;

  /** Inline service-account JSON, raw or base64 (alternative to the path). */
  @IsString()
  @IsOptional()
  FIREBASE_SERVICE_ACCOUNT_KEY?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors
        .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
        .join('\n')}`,
    );
  }

  const hasCredentialSource =
    !!validated.GOOGLE_APPLICATION_CREDENTIALS || !!validated.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (validated.NODE_ENV !== NodeEnv.Production && !hasCredentialSource) {
    throw new Error(
      'Invalid environment configuration:\n' +
        '  - Firebase credentials: set GOOGLE_APPLICATION_CREDENTIALS or ' +
        'FIREBASE_SERVICE_ACCOUNT_KEY outside production (production uses ADC).',
    );
  }

  return validated;
}
