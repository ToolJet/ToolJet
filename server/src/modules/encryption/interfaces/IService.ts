export interface IEncryptionService {
  encryptColumnValue(table: string, column: string, text: string): Promise<string>;
  decryptColumnValue(table: string, column: string, cipherText: string): Promise<string>;
}
