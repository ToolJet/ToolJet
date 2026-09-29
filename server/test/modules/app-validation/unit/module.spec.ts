import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import { AppValidationModule } from '@modules/app-validation/module';
import { AppValidationService as CeAppValidationService } from '@modules/app-validation/service';
import { AppValidationService as EeAppValidationService } from '@ee/app-validation/service';

describe('AppValidationModule', () => {
  const originalEdition = process.env.TOOLJET_EDITION;

  afterEach(() => {
    process.env.TOOLJET_EDITION = originalEdition;
  });

  // IS_GET_CONTEXT resolves providers from src/ instead of dist/, as in migrations.
  it.each([
    ['ce', CeAppValidationService],
    ['ee', EeAppValidationService],
  ])('wires AppValidationService for the %s edition', async (edition, expectedClass) => {
    process.env.TOOLJET_EDITION = edition;
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot(), await AppValidationModule.register({ IS_GET_CONTEXT: true })],
    }).compile();

    const exported = await AppValidationModule.register({ IS_GET_CONTEXT: true });
    const serviceClass = exported.exports[0] as any;
    const service = moduleRef.get(serviceClass);

    expect(serviceClass).toBe(expectedClass);
    expect(service).toBeInstanceOf(CeAppValidationService);
    expect(typeof service.check).toBe('function');
    await moduleRef.close();
  });
});
