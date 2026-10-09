import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import { AppValidationModule } from '@modules/app-validation/module';
import { AppValidationService } from '@modules/app-validation/service';

describe('AppValidationModule', () => {
  const originalEdition = process.env.TOOLJET_EDITION;

  afterEach(() => {
    process.env.TOOLJET_EDITION = originalEdition;
  });

  // IS_GET_CONTEXT resolves providers from src/ instead of dist/, as in migrations.
  it('wires AppValidationService for the ce edition', async () => {
    process.env.TOOLJET_EDITION = 'ce';
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot(), await AppValidationModule.register({ IS_GET_CONTEXT: true })],
    }).compile();

    const exported = await AppValidationModule.register({ IS_GET_CONTEXT: true });
    const serviceClass = exported.exports[0] as any;
    const service = moduleRef.get(serviceClass);

    expect(serviceClass).toBe(AppValidationService);
    expect(typeof service.check).toBe('function');
    await moduleRef.close();
  });
});
