import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from '@modules/encryption/service';

/**
 * @group unit
 */
describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    process.env['LOCKBOX_MASTER_KEY'] = '3dbbbac7043d25ac4ab1f5724f1d51f4dd399779dee5b7015d17e8615ab2fc37';

    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should encrypt and decrypt column values to the same plaintext', async () => {
    const encryptedText = await service.encryptColumnValue('credentials', 'value', 'Hello');
    const decryptedText = await service.decryptColumnValue('credentials', 'value', encryptedText);
    expect(decryptedText).toBe('Hello');
  });

  it('should produce different ciphertexts for the same plaintext (random IV)', async () => {
    const encrypted1 = await service.encryptColumnValue('credentials', 'value', 'Hello');
    const encrypted2 = await service.encryptColumnValue('credentials', 'value', 'Hello');
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should handle empty string encryption', async () => {
    const encrypted = await service.encryptColumnValue('credentials', 'value', '');
    const decrypted = await service.decryptColumnValue('credentials', 'value', encrypted);
    expect(decrypted).toBe('');
  });

  it('should handle special characters', async () => {
    const specialChars = '{"key": "value", "unicode": "こんにちは", "emoji": "🔑"}';
    const encrypted = await service.encryptColumnValue('credentials', 'value', specialChars);
    const decrypted = await service.decryptColumnValue('credentials', 'value', encrypted);
    expect(decrypted).toBe(specialChars);
  });
});
