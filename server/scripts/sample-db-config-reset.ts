import { AppModule } from '@modules/app/module';
import { TOOLJET_EDITIONS, getImportPath } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { NestFactory } from '@nestjs/core';

async function sampleDbConfigReset() {
  const app = await NestFactory.create(await AppModule.register({ IS_GET_CONTEXT: true }), {
    logger: ['error', 'warn'],
  });
  // EE/Cloud register the edition subclass, not the CE class.
  const { SampleDataSourceService } = await import(
    `${await getImportPath(true, getTooljetEdition() as TOOLJET_EDITIONS)}/data-sources/services/sample-ds.service`
  );
  const dataSourceService = app.get(SampleDataSourceService);

  await dataSourceService.updateSampleDs();
  await app.close();
  // TODO: process exit wasn't needed earlier
  // need to debug why app.close() doesn't exit gracefully
  process.exit(0);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
sampleDbConfigReset();
