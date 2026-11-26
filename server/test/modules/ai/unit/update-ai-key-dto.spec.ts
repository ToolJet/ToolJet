/** @group platform */
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateAiKeyDto } from '@modules/ai/dto/update-ai-key.dto';

const check = async (payload: object) => {
  const dto = plainToInstance(UpdateAiKeyDto, payload);
  const errors = await validate(dto, { whitelist: true });
  return { dto, errors };
};

describe('UpdateAiKeyDto', () => {
  it('accepts the payload the BYOK page sends and keeps every field', async () => {
    const payload = {
      apikey: 'sk-test',
      licenseType: 'byok',
      useEnvironmentConfig: false,
      provider: 'openrouter',
      model: 'some/model',
      modelContextWindow: 128000,
    };

    const { dto, errors } = await check(payload);

    expect(errors).toHaveLength(0);
    expect(dto).toMatchObject(payload);
  });

  it('accepts the environment-config toggle payload (empty key, no provider)', async () => {
    const payload = { apikey: '', licenseType: 'byok', useEnvironmentConfig: true };

    const { dto, errors } = await check(payload);

    expect(errors).toHaveLength(0);
    expect(dto).toMatchObject(payload);
  });

  it('accepts a missing or null modelContextWindow, which the page can send for an unknown model', async () => {
    expect((await check({ licenseType: 'byok', modelContextWindow: null })).errors).toHaveLength(0);
    expect((await check({ licenseType: 'byok' })).errors).toHaveLength(0);
  });

  it('leaves licenseType and provider values to the service, so its existing error messages still apply', async () => {
    expect((await check({ licenseType: 'not-a-type', provider: 'not-a-provider' })).errors).toHaveLength(0);
  });

  it('rejects a key that is not a string instead of letting it crash the service', async () => {
    const { errors } = await check({ licenseType: 'byok', apikey: { nested: true } });

    expect(errors.map((error) => error.property)).toContain('apikey');
  });

  it('rejects a non-boolean useEnvironmentConfig', async () => {
    const { errors } = await check({ licenseType: 'byok', useEnvironmentConfig: 'yes' });

    expect(errors.map((error) => error.property)).toContain('useEnvironmentConfig');
  });
});
