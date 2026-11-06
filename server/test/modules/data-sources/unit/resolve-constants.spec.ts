import { DataSourcesUtilService } from '../../../../src/modules/data-sources/util.service';

function serviceWithSecrets(secrets: Record<string, string>): DataSourcesUtilService {
  return new DataSourcesUtilService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {
      decryptColumnValue: jest.fn(async (_table: string, _organizationId: string, value: string) => value),
    } as any,
    {} as any,
    {
      getOrgEnvironmentConstant: jest.fn(async (key: string) => ({ value: secrets[key] })),
    } as any,
    {} as any,
    {} as any
  );
}

/** @group platform */
describe('DataSourcesUtilService.resolveConstants | dollar sequences in resolved values', () => {
  it('should keep a secret containing $$ unchanged', async () => {
    const service = serviceWithSecrets({ DB_PASS: 'ab$$cd' });

    await expect(service.resolveConstants('{{secrets.DB_PASS}}', 'organization', 'environment')).resolves.toBe(
      'ab$$cd'
    );
  });

  it('should keep a secret containing $& unchanged instead of expanding it to the placeholder', async () => {
    const service = serviceWithSecrets({ DB_PASS: 'p$&q' });

    await expect(service.resolveConstants('{{secrets.DB_PASS}}', 'organization', 'environment')).resolves.toBe('p$&q');
  });

  it('should keep a secret containing the $` sequence unchanged instead of inserting the text before the match', async () => {
    const service = serviceWithSecrets({ DB_PASS: 'a$`b' });

    await expect(service.resolveConstants('prefix {{secrets.DB_PASS}}', 'organization', 'environment')).resolves.toBe(
      'prefix a$`b'
    );
  });

  it("should keep a secret containing the $' sequence unchanged instead of inserting the text after the match", async () => {
    const service = serviceWithSecrets({ DB_PASS: "a$'b" });

    await expect(service.resolveConstants('{{secrets.DB_PASS}} suffix', 'organization', 'environment')).resolves.toBe(
      "a$'b suffix"
    );
  });

  it('should resolve every placeholder when multiple values contain $ sequences', async () => {
    const service = serviceWithSecrets({ DB_USER: 'admin', DB_PASS: 'p$&q' });

    await expect(
      service.resolveConstants('user={{secrets.DB_USER}}&pass={{secrets.DB_PASS}}', 'organization', 'environment')
    ).resolves.toBe('user=admin&pass=p$&q');
  });

  it('should keep dollar sequences in constants unchanged too', async () => {
    const service = serviceWithSecrets({ API_KEY: 'k$$$&v' });

    await expect(service.resolveConstants('{{constants.API_KEY}}', 'organization', 'environment')).resolves.toBe(
      'k$$$&v'
    );
  });
});
