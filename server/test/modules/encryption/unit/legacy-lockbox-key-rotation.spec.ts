/** @group platform */
import { EncryptionService } from '@modules/encryption/service';
import { LEGACY_SAMPLE_LOCKBOX_KEY } from '@helpers/sample-secrets.helper';
import { DualKeyEncryptionService } from '../../../../scripts/services/rotation.service';

describe('Rotating away from the legacy sample lockbox key', () => {
  const ORIGINAL_KEY = process.env.LOCKBOX_MASTER_KEY;
  const newKey = '3dbbbac7043d25ac4ab1f5724f1d51f4dd399779dee5b7015d17e8615ab2fc37';

  afterEach(() => {
    process.env.LOCKBOX_MASTER_KEY = ORIGINAL_KEY;
  });

  it('decrypts what the server encrypted with the legacy key and re-encrypts it with the new key', async () => {
    process.env.LOCKBOX_MASTER_KEY = LEGACY_SAMPLE_LOCKBOX_KEY;
    const cipherText = await new EncryptionService().encryptColumnValue('credentials', 'value', 'db-password');

    const rotation = new DualKeyEncryptionService(LEGACY_SAMPLE_LOCKBOX_KEY, newKey);
    const plainText = await rotation.decryptWithOldKey('credentials', 'value', cipherText);
    const reEncrypted = await rotation.encryptWithNewKey('credentials', 'value', plainText);

    process.env.LOCKBOX_MASTER_KEY = newKey;
    expect(plainText).toBe('db-password');
    await expect(new EncryptionService().decryptColumnValue('credentials', 'value', reEncrypted)).resolves.toBe(
      'db-password'
    );
  });

  it('still rejects a malformed new key', () => {
    expect(() => new DualKeyEncryptionService(LEGACY_SAMPLE_LOCKBOX_KEY, 'not-hex')).toThrow();
  });
});
