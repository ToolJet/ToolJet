import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SeedsService } from '@services/seeds.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  const seedsService = app.get(SeedsService);

  await seedsService.perform();

  await app.close();
  // TODO: process exit wasn't needed earlier
  // need to debug why app.close() doesn't exit gracefully
  process.exit(0);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
