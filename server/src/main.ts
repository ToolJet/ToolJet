import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const fs = require('fs');

declare var TOOLJET_VERSION;
globalThis.TOOLJET_VERSION = fs.readFileSync('../.version', 'utf8')

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
