import { AddSsrfProtectionInstanceSettings1790600000000 } from '../../../../data-migrations/1790600000000-AddSsrfProtectionInstanceSettings';
import { QueryRunner } from 'typeorm';
import { INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';

const runMigration = async ({
  organizations,
  existingKeys = [],
}: {
  organizations: number;
  existingKeys?: string[];
}) => {
  const inserted: Record<string, string> = {};
  const manager = {
    count: jest.fn().mockResolvedValue(organizations),
    findOne: jest.fn(async (_entity, { where: { key } }) => (existingKeys.includes(key) ? { key } : null)),
    insert: jest.fn(async (_entity, row: { key: string; value: string }) => {
      inserted[row.key] = row.value;
    }),
  };
  await new AddSsrfProtectionInstanceSettings1790600000000().up({ manager } as unknown as QueryRunner);
  return inserted;
};

describe('SSRF settings data migration', () => {
  const originalEnv = process.env.SSRF_PROTECTION_ENABLED;
  beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
  afterEach(() => {
    if (originalEnv === undefined) delete process.env.SSRF_PROTECTION_ENABLED;
    else process.env.SSRF_PROTECTION_ENABLED = originalEnv;
  });

  it('leaves the toggle unset on a new installation, so protection is on (off in dev mode)', async () => {
    const inserted = await runMigration({ organizations: 0 });

    expect(inserted).toMatchObject({
      [INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED]: '',
      [INSTANCE_SYSTEM_SETTINGS.SSRF_ALLOWED_ADDRESSES]: '[]',
      [INSTANCE_SYSTEM_SETTINGS.SSRF_UPGRADE_NOTICE_DISMISSED]: 'false',
    });
  });

  it('keeps protection off on an existing setup that never opted in', async () => {
    delete process.env.SSRF_PROTECTION_ENABLED;

    const inserted = await runMigration({ organizations: 3 });

    expect(inserted[INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED]).toBe('false');
  });

  it('keeps protection on for an existing setup that opted in with SSRF_PROTECTION_ENABLED=true', async () => {
    process.env.SSRF_PROTECTION_ENABLED = 'true';

    const inserted = await runMigration({ organizations: 3 });

    expect(inserted[INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED]).toBe('true');
  });

  it('keeps protection off on an existing setup that set SSRF_PROTECTION_ENABLED=false', async () => {
    process.env.SSRF_PROTECTION_ENABLED = 'false';

    const inserted = await runMigration({ organizations: 3 });

    expect(inserted[INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED]).toBe('false');
  });

  it.each(['true', 'false'])(
    'ignores SSRF_PROTECTION_ENABLED=%s on a new installation, leaving the toggle unset',
    async (envValue) => {
      process.env.SSRF_PROTECTION_ENABLED = envValue;

      const inserted = await runMigration({ organizations: 0 });

      expect(inserted[INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED]).toBe('');
    }
  );

  it('shows the dashboard notice on a new installation only', async () => {
    const fresh = await runMigration({ organizations: 0 });
    const upgraded = await runMigration({ organizations: 3 });

    expect(fresh[INSTANCE_SYSTEM_SETTINGS.SSRF_UPGRADE_NOTICE_DISMISSED]).toBe('false');
    expect(upgraded[INSTANCE_SYSTEM_SETTINGS.SSRF_UPGRADE_NOTICE_DISMISSED]).toBe('true');
  });

  it('never overwrites a value that is already stored', async () => {
    const inserted = await runMigration({
      organizations: 3,
      existingKeys: [INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED],
    });

    expect(inserted).not.toHaveProperty(INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED);
  });
});
