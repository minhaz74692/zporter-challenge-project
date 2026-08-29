import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Run onModuleDestroy hooks (FirebaseService closes the Admin app) on SIGTERM.
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(`API listening on :${port}`);
}

// A rejected background promise from a client SDK (e.g. Firestore credential
// resolution) must not take the whole API process down.
process.on('unhandledRejection', (reason) => {
  new Logger('UnhandledRejection').error(reason);
});

await bootstrap();
