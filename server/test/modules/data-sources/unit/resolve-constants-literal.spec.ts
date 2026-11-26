import { DataSourcesUtilService } from '@modules/data-sources/util.service';

// `$&`, `$'`, `$$` and `` $` `` are special in String.replace. A secret that contains them must be inserted as is.
const SPECIAL_VALUES = ['pa$&ss', "p$'x", 'a$$b', 'a$`b'];

function serviceWithSecret(secret: string) {
  const service: any = Object.create(DataSourcesUtilService.prototype);
  service.organizationConstantsUtilService = {
    getOrgEnvironmentConstant: jest.fn().mockResolvedValue({ value: 'ciphertext' }),
  };
  service.encryptionService = { decryptColumnValue: jest.fn().mockResolvedValue(secret) };
  return service as DataSourcesUtilService;
}

describe('DataSourcesUtilService.resolveConstants inserts values literally', () => {
  it.each(SPECIAL_VALUES)('a secret containing %s', async (secret) => {
    const result = await serviceWithSecret(secret).resolveConstants('x-{{secrets.key}}-y', 'org', 'env');
    expect(result).toBe(`x-${secret}-y`);
  });

  it('collects the secret as it was stored, so it can be scrubbed from the response', async () => {
    const collected: string[] = [];
    await serviceWithSecret('pa$&ss').resolveConstants('{{secrets.key}}', 'org', 'env', undefined, collected);
    expect(collected).toEqual(['pa$&ss']);
  });
});
