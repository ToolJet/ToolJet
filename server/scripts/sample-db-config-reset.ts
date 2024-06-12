import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSourcesService } from '@services/data_sources.service';

async function sampleDbConfigReset() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });
  const dataSourceService = app.get(DataSourcesService);

  await dataSourceService.updateSampleDs();
  await app.close();
  // TODO: process exit wasn't needed earlier
  // need to debug why app.close() doesn't exit gracefully
  process.exit(0);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
sampleDbConfigReset();
