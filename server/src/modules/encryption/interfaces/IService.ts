export interface IEncryptionService {
  /**
   * IMPORTANT: Do not modify this function signature - it is used in data migrations.
   * Used in: 1669054493160, 1706024347284, 1650485473528, 1716551121164, 1681463532466, 1683022868045
   */
  encryptColumnValue(table: string, column: string, text: string): Promise<string>;
  decryptColumnValue(table: string, column: string, cipherText: string): Promise<string>;
}
