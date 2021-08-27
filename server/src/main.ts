import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import fs = require('fs');

globalThis.TOOLJET_VERSION = fs.readFileSync('./.version', 'utf8');
globalThis.CACHED_CONNECTIONS = {};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  await app.setGlobalPrefix('api');
  await app.enableCors();

  app.useLogger(app.get(Logger));
  app.use(
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'blob:'],
        'default-src': ["'self'", 'blob:'],
      },
    }),
  );
  const PORT = parseInt(process.env.PORT) || 3000;

  await app.listen(PORT, '0.0.0.0', () => {
    console.log(`Listening on port ${PORT}`);
  });
}

bootstrap();
