import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configuration } from './configuration.js';
import { validateEnv } from './env.validation.js';

/**
 * App-wide configuration. `isGlobal` so no other module has to re-import it;
 * `validate` runs the class-validator schema at boot.
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
})
export class ConfigModule {}
