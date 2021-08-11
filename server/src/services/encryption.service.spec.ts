import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should generate derived keys', () => {
    process.env['LOCKBOX_MASTER_KEY'] = '3dbbbac7043d25ac4ab1f5724f1d51f4dd399779dee5b7015d17e8615ab2fc37';
    const derivedKey = service.computeAttributeKey('credentials', 'value');
    expect(derivedKey).toBe('30129aa38f9bf34b060045bd58bfd4a3883ba135d87e70cc9cc602f179fe3780');
  });

  it('should encrypt & decrypt text', () => {
    const derivedKey = '30129aa38f9bf34b060045bd58bfd4a3883ba135d87e70cc9cc602f179fe3780';
    const encryptedText = service.encrypt('Hello', derivedKey);

    const decryptedText = service.decrypt(encryptedText, derivedKey);
    expect(decryptedText).toBe('Hello');
  });

  it('should encrypt and decrypt table column values using derived keys', async () => {
    process.env['LOCKBOX_MASTER_KEY'] = '3dbbbac7043d25ac4ab1f5724f1d51f4dd399779dee5b7015d17e8615ab2fc37';
    const encryptedText = await service.encryptColumnValue('credentials', 'value', 'Hello');
    const decryptedText = await service.decryptColumnValue('credentials', 'value', encryptedText);
    expect(decryptedText).toBe('Hello');
  });

});