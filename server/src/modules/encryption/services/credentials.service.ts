import { dbTransactionWrap } from '@helpers/database.helper';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EncryptionService } from '../service';
import { Credential } from '@entities/credential.entity';

@Injectable()
export class CredentialsService {
  constructor(protected readonly encryptionService: EncryptionService) {}

  async create(value: string, manager?: EntityManager): Promise<Credential> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const newCredential = manager.create(Credential, {
        valueCiphertext: await this.encryptionService.encryptColumnValue('credentials', 'value', value),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const credential = await manager.save(newCredential);
      return credential;
    }, manager);
  }

  async update(id: string, value: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const valueCiphertext = await this.encryptionService.encryptColumnValue('credentials', 'value', value);
      const params = { valueCiphertext, updatedAt: new Date() };

      return await manager.update(Credential, id, params);
    }, manager);
  }

  async getValue(credentialId: string, manager?: EntityManager): Promise<string> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const credential = await manager.findOne(Credential, { where: { id: credentialId } });
      const decryptedValue = await this.encryptionService.decryptColumnValue(
        'credentials',
        'value',
        credential.valueCiphertext
      );
      return decryptedValue;
    }, manager);
  }
}
