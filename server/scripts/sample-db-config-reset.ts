import { AppModule } from '@modules/app/module';
import { SampleDataSourceService } from '@modules/data-sources/services/sample-ds.service';
import { NestFactory } from '@nestjs/core';

async function sampleDbConfigReset() {
  const app = await NestFactory.create(await AppModule.register({ IS_GET_CONTEXT: true }), {
    logger: ['error', 'warn'],
  });
  const dataSourceService = app.get(SampleDataSourceService);

  await dataSourceService.updateSampleDs();
  await app.close();
  // TODO: process exit wasn't needed earlier
  // need to debug why app.close() doesn't exit gracefully
  process.exit(0);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
sampleDbConfigReset();
