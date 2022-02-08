import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from '../../src/entities/credential.entity';
import { getManager, Repository } from 'typeorm';
import { EncryptionService } from './encryption.service';

@Injectable()
export class CredentialsService {
  constructor(
    private encryptionService: EncryptionService,
    @InjectRepository(Credential)
    private credentialsRepository: Repository<Credential>
  ) {}

  async create(value: string, entityManager = getManager()): Promise<Credential> {
    const credentialRepository = entityManager.getRepository(Credential);
    const newCredential = credentialRepository.create({
      valueCiphertext: await this.encryptionService.encryptColumnValue('credentials', 'value', value),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const credential = await credentialRepository.save(newCredential);
    return credential;
  }

  async update(id: string, value: string) {
    const valueCiphertext = await this.encryptionService.encryptColumnValue('credentials', 'value', value);
    const params = { valueCiphertext, updatedAt: new Date() };

    return await this.credentialsRepository.update(id, params);
  }

  async getValue(credentialId: string): Promise<string> {
    const credential = await this.credentialsRepository.findOne({ where: { id: credentialId } });
    const decryptedValue = await this.encryptionService.decryptColumnValue(
      'credentials',
      'value',
      credential.valueCiphertext
    );
    return decryptedValue;
  }
}
