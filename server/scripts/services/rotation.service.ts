import * as hkdf from 'futoin-hkdf';

const crypto = require('crypto');

/**
 * DualKeyEncryptionService
 *
 * Temporary service for LOCKBOX_MASTER_KEY rotation.
 * Can encrypt/decrypt with two different master keys simultaneously.
 *
 * This service is used exclusively by the rotate-lockbox-key.ts script
 * and should not be used in production application code.
 */
export class DualKeyEncryptionService {
  private oldKey: Buffer;
  private newKey: Buffer;

  constructor(oldMasterKey: string, newMasterKey: string) {
    // Validate key formats
    this.validateKeyFormat(oldMasterKey, 'OLD');
    this.validateKeyFormat(newMasterKey, 'NEW');

    // Store keys as buffers
    this.oldKey = Buffer.from(oldMasterKey, 'hex');
    this.newKey = Buffer.from(newMasterKey, 'hex');
  }

  /**
   * Validate that a master key is in the correct format
   * Must be exactly 64 hexadecimal characters (32 bytes = 256 bits)
   */
  private validateKeyFormat(key: string, keyLabel: string): void {
    if (!key) {
      throw new Error(`${keyLabel}_LOCKBOX_MASTER_KEY is not set`);
    }

    const hexRegex = /^[0-9a-fA-F]{64}$/;
    if (!hexRegex.test(key)) {
      throw new Error(
        `${keyLabel}_LOCKBOX_MASTER_KEY must be exactly 64 hexadecimal characters (0-9, a-f, A-F). ` +
        `Got ${key.length} characters.`
      );
    }
  }

  /**
   * Test that a key can successfully encrypt and decrypt data
   */
  async testEncryptionCycle(masterKey: string, keyLabel: string): Promise<void> {
    const testData = 'test-encryption-data-12345';
    const testTable = 'test_table';
    const testColumn = 'test_column';

    try {
      // Encrypt with the key
      const encrypted = this.encrypt(testData, masterKey, testTable, testColumn);

      // Decrypt with the same key
      const decrypted = this.decrypt(encrypted, masterKey, testTable, testColumn);

      // Verify roundtrip
      if (decrypted !== testData) {
        throw new Error(`Encryption roundtrip failed: expected "${testData}", got "${decrypted}"`);
      }
    } catch (error) {
      throw new Error(`${keyLabel} encryption test failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using the OLD master key
   */
  async decryptWithOldKey(table: string, column: string, cipherText: string): Promise<string> {
    return this.decrypt(cipherText, this.oldKey.toString('hex'), table, column);
  }

  /**
   * Encrypt data using the NEW master key
   */
  async encryptWithNewKey(table: string, column: string, plainText: string): Promise<string> {
    return this.encrypt(plainText, this.newKey.toString('hex'), table, column);
  }

  /**
   * Encrypt plaintext using specified master key
   *
   * Algorithm: AES-256-GCM with HKDF-SHA384 key derivation
   * Format: base64(nonce[12] + ciphertext + auth_tag[16])
   */
  private encrypt(text: string, masterKey: string, table: string, column: string): string {
    const derivedKey = this.computeAttributeKey(masterKey, table, column);

    // Generate random 12-byte nonce
    const nonce = crypto.randomBytes(12);

    // Convert derived key from hex to buffer
    const key = Buffer.from(derivedKey, 'hex');

    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);

    // Encrypt the text
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine: nonce + encrypted + tag, then base64 encode
    const encryptedString = Buffer.concat([nonce, encrypted, tag]).toString('base64');

    return encryptedString;
  }

  /**
   * Decrypt ciphertext using specified master key
   *
   * Expects format: base64(nonce[12] + ciphertext + auth_tag[16])
   */
  private decrypt(cipherText: string, masterKey: string, table: string, column: string): string {
    const derivedKey = this.computeAttributeKey(masterKey, table, column);

    // Convert derived key from hex to buffer
    const key = Buffer.from(derivedKey, 'hex');

    // Decode base64 ciphertext
    let ciphertext = Buffer.from(cipherText, 'base64');

    // Extract components
    const nonce = ciphertext.subarray(0, 12);        // First 12 bytes
    const auth_tag = ciphertext.subarray(-16);       // Last 16 bytes
    ciphertext = ciphertext.subarray(12, -16);       // Middle bytes

    // Create decipher
    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    aesgcm.setAuthTag(auth_tag);

    // Decrypt
    const plainText = aesgcm.update(ciphertext) + aesgcm.final();

    return plainText;
  }

  /**
   * Compute derived key for a specific table/column combination
   *
   * Uses HKDF-SHA384 key derivation (compatible with Ruby Lockbox gem)
   * Each table/column pair gets a unique derived key from the master key
   *
   * @param masterKey - The master encryption key (64 hex chars)
   * @param table - Database table name (used as HKDF salt)
   * @param column - Column name (used in HKDF info parameter)
   * @returns 64-character hex string (32 bytes) for AES-256
   */
  private computeAttributeKey(masterKey: string, table: string, column: string): string {
    const key = Buffer.from(masterKey, 'hex');

    // Create salt buffer (32 bytes of '´' character)
    const salt = Buffer.alloc(32, '´', 'ascii');

    // Create info buffer: salt + column name + '_ciphertext'
    const info = Buffer.concat([salt, Buffer.from(`${column}_ciphertext`)]);

    // Derive key using HKDF with SHA-384
    const derivedKey = hkdf(key, 32, { salt: table, info, hash: 'sha384' });
    const finalDerivedKey = Buffer.from(derivedKey).toString('hex');

    return finalDerivedKey;
  }

  /**
   * Get statistics about the key derivation
   * Useful for debugging and verification
   */
  getKeyInfo(): { oldKeyLength: number; newKeyLength: number; keysAreDifferent: boolean } {
    return {
      oldKeyLength: this.oldKey.length,
      newKeyLength: this.newKey.length,
      keysAreDifferent: !this.oldKey.equals(this.newKey),
    };
  }
}
