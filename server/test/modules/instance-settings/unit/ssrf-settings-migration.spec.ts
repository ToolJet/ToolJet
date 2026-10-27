import { AddSsrfProtectionInstanceSettings1790600000000 } from '../../../../data-migrations/1790600000000-AddSsrfProtectionInstanceSettings';
import { QueryRunner } from 'typeorm';
import { INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';

// Fakes the two statements the migration runs: the workspace check and the per-row insert, which skips a key
// that already exists (the real table enforces that through ON CONFLICT on its unique key).
const runMigration = async ({
  organizations,
  existingKeys = [],
}: {
  organizations: number;
  existingKeys?: string[];
}) => {
  const inserted: Record<string, string> = {};
  const query = jest.fn(async (sql: string, params: string[] = []) => {
    if (/^\s*SELECT EXISTS/i.test(sql)) return [{ exists: organizations > 0 }];
    if (/^\s*INSERT INTO instance_settings/i.test(sql)) {
      const [key, value] = params;
      if (existingKeys.includes(key)) return [];
      inserted[key] = value;
      return [{ id: key }];
    }
    throw new Error(`unexpected SQL: ${sql}`);
  });
  await new AddSsrfProtectionInstanceSettings1790600000000().up({ query } as unknown as QueryRunner);
  return { inserted, query };
};

describe('SSRF settings data migration', () => {
  const originalEnv = process.env.SSRF_PROTECTION_ENABLED;
  beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
  afterEach(() => {
    if (originalEnv === undefined) delete process.env.SSRF_PROTECTION_ENABLED;
    else process.env.SSRF_PROTECTION_ENABLED = originalEnv;
  });

  it('leaves the toggle unset on a new installation, so protection is on (off in dev mode)', async () => {
    const { inserted } = await runMigration({ organizations: 0 });

    expect(inserted).toMatchObject({
      [INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED]: '',
      [INSTANCE_SYSTEM_SETTINGS.SSRF_ALLOWED_ADDRESSES]: '[]',
      [INSTANCE_SYSTEM_SETTINGS.SSRF_UPGRADE_NOTICE_DISMISSED]: 'false',
    });
  });

  it('keeps protection off on an existing setup that never opted in', async () => {
    delete process.env.SSRF_PROTECTION_ENABLED;

    const { inserted } = await runMigration({ organizations: 3 });

    expect(inserted[INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED]).toBe('false');
  });

  it('keeps protection on for an existing setup that opted in with SSRF_PROTECTION_ENABLED=true', async () => {
    process.env.SSRF_PROTECTION_ENABLED = 'true';

    const { inserted } = await runMigration({ organizations: 3 });

    expect(inserted[INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED]).toBe('true');
  });

  it('keeps protection off on an existing setup that set SSRF_PROTECTION_ENABLED=false', async () => {
    process.env.SSRF_PROTECTION_ENABLED = 'false';

    const { inserted } = await runMigration({ organizations: 3 });

    expect(inserted[INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED]).toBe('false');
  });

  it.each(['true', 'false'])(
    'ignores SSRF_PROTECTION_ENABLED=%s on a new installation, leaving the toggle unset',
    async (envValue) => {
      process.env.SSRF_PROTECTION_ENABLED = envValue;

      const { inserted } = await runMigration({ organizations: 0 });

      expect(inserted[INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED]).toBe('');
    }
  );

  it('shows the dashboard notice on a new installation only', async () => {
    const { inserted: fresh } = await runMigration({ organizations: 0 });
    const { inserted: upgraded } = await runMigration({ organizations: 3 });

    expect(fresh[INSTANCE_SYSTEM_SETTINGS.SSRF_UPGRADE_NOTICE_DISMISSED]).toBe('false');
    expect(upgraded[INSTANCE_SYSTEM_SETTINGS.SSRF_UPGRADE_NOTICE_DISMISSED]).toBe('true');
  });

  it('never overwrites a value that is already stored', async () => {
    const { inserted, query } = await runMigration({
      organizations: 3,
      existingKeys: [INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED],
    });

    expect(inserted).not.toHaveProperty(INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED);
    expect(query).toHaveBeenCalledWith(expect.stringMatching(/ON CONFLICT \(key\) DO NOTHING/), expect.any(Array));
  });
});
