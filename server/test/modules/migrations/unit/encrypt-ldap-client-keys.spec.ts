import { EncryptLdapClientKeys1795589444000 } from '../../../../migrations/data/1795589444000-EncryptLdapClientKeys';
import { EncryptionService } from '@modules/encryption/service';

const PLAIN_KEY = '-----BEGIN PRIVATE KEY-----synthetic-ldap-client-key-----END PRIVATE KEY-----';

function fakeQueryRunner(rows: { id: string; configs: unknown }[]) {
  const stored = new Map(rows.map((row) => [row.id, JSON.stringify(row.configs)]));
  const query = jest.fn(async (sql: string, params?: unknown[]) => {
    if (sql.startsWith('SELECT')) return [...stored].map(([id, configs]) => ({ id, configs }));
    stored.set(params![1] as string, params![0] as string);
    return [];
  });
  return { queryRunner: { query } as any, query, read: (id: string) => JSON.parse(stored.get(id)!) };
}

describe('EncryptLdapClientKeys migration', () => {
  const encryption = () => new EncryptionService();
  const migration = new EncryptLdapClientKeys1795589444000();

  beforeAll(() => {
    process.env.LOCKBOX_MASTER_KEY ??= '1d291a926ddfd221205a23adb4cc1db66cb9fcaf28d97c8c1950e3538e3b9281';
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterAll(() => jest.restoreAllMocks());

  it('encrypts a plain text client key so the app can decrypt it', async () => {
    const { queryRunner, read } = fakeQueryRunner([{ id: 'a', configs: { host: 'h', sslCerts: { client_key: PLAIN_KEY } } }]);
    await migration.up(queryRunner);

    const stored = read('a').sslCerts.client_key;
    expect(stored).not.toContain('synthetic-ldap-client-key');
    await expect(encryption().decryptColumnValue('ssoConfigs', 'client_key', stored)).resolves.toBe(PLAIN_KEY);
  });

  it('leaves a key that is already encrypted unchanged, so a rerun is safe', async () => {
    const ciphertext = await encryption().encryptColumnValue('ssoConfigs', 'client_key', PLAIN_KEY);
    const { queryRunner, query } = fakeQueryRunner([{ id: 'a', configs: { sslCerts: { client_key: ciphertext } } }]);
    await migration.up(queryRunner);

    expect(query.mock.calls.filter(([sql]) => String(sql).startsWith('UPDATE'))).toHaveLength(0);
  });

  it('skips configs without a client key and keeps the other fields', async () => {
    const { queryRunner, read, query } = fakeQueryRunner([
      { id: 'a', configs: { host: 'h', ssl: false } },
      { id: 'b', configs: { host: 'h', sslCerts: { client_key: PLAIN_KEY, client_cert: 'cert', server_cert: 'ca' } } },
    ]);
    await migration.up(queryRunner);

    expect(query.mock.calls.filter(([sql]) => String(sql).startsWith('UPDATE'))).toHaveLength(1);
    expect(read('a')).toEqual({ host: 'h', ssl: false });
    expect(read('b').sslCerts).toMatchObject({ client_cert: 'cert', server_cert: 'ca' });
  });

  it('down() writes the key back as plain text', async () => {
    const { queryRunner, read } = fakeQueryRunner([{ id: 'a', configs: { sslCerts: { client_key: PLAIN_KEY } } }]);
    await migration.up(queryRunner);
    await migration.down(queryRunner);

    expect(read('a').sslCerts.client_key).toBe(PLAIN_KEY);
  });
});
