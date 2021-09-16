/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from '@nestjs/common';
// import crypto from 'crypto';
// import hkdf from 'futoin-hkdf';
const crypto = require('crypto');
const hkdf = require('futoin-hkdf');

@Injectable()
export class EncryptionService {
  async encryptColumnValue(table: string, column: string, text: string): Promise<string> {
    const derivedKey = this.computeAttributeKey(table, column);
    return this.encrypt(text, derivedKey);
  }

  async decryptColumnValue(table: string, column: string, cipherText: string): Promise<string> {
    const derivedKey = this.computeAttributeKey(table, column);
    return this.decrypt(cipherText, derivedKey);
  }

  encrypt(text: string, derivedKey: string): string {
    const nonce = crypto.randomBytes(12);
    const key = Buffer.from(derivedKey, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const encryptedString = Buffer.concat([nonce, encrypted, tag]).toString('base64');

    return encryptedString;
  }

  decrypt(cipherText: string, derivedKey: string): string {
    const key = Buffer.from(derivedKey, 'hex');
    let ciphertext = Buffer.from(cipherText, 'base64');

    const nonce = ciphertext.slice(0, 12);
    const auth_tag = ciphertext.slice(-16);
    ciphertext = ciphertext.slice(12, -16);

    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    aesgcm.setAuthTag(auth_tag);
    const plainText = `${aesgcm.update(ciphertext)} ${aesgcm.final()}`;

    return plainText;
  }

  // Generating separated keys for every column using the method used by Lockbox gem - https://github.com/ankane/lockbox
  // This was needed when we migrated from Ruby on Rails to NestJS
  computeAttributeKey(table: string, column: string): string {
    const key = Buffer.from(process.env.LOCKBOX_MASTER_KEY, 'hex');
    const salt = Buffer.alloc(32, '´', 'ascii');
    const info = Buffer.concat([salt, Buffer.from(`${column}_ciphertext`)]);

    const derivedKey = hkdf(key, 32, { salt: table, info, hash: 'sha384' });
    const finalDerivedKey = Buffer.from(derivedKey).toString('hex');

    return finalDerivedKey;
  }
}
