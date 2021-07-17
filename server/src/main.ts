import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
require('dotenv').config({ path: '../.env' })

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'log', 'verbose'],
  });
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
