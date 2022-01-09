import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/src/app.module';
import { SeedsService } from '../dist/src/services/seeds.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  const seedsService = app.get(SeedsService);

  await seedsService.perform();
  await app.close();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
