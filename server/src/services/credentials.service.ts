import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from '../../src/entities/credential.entity';
import { Repository } from 'typeorm';
import { EncryptionService } from './encryption.service';

@Injectable()
export class CredentialsService {
  constructor(
    private encryptionService: EncryptionService,
    @InjectRepository(Credential)
    private credentialsRepository: Repository<Credential>
  ) {}

  async create(value: string): Promise<Credential> {
    const newCredential = this.credentialsRepository.create({
      valueCiphertext: await this.encryptionService.encryptColumnValue('credentials', 'value', value),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const credential = await this.credentialsRepository.save(newCredential);
    return credential;
  }

  async update(id: string, value: string) {
    const valueCiphertext = await this.encryptionService.encryptColumnValue('credentials', 'value', value);
    const params = { valueCiphertext, updatedAt: new Date() };

    return await this.credentialsRepository.update(id, params);
  }

  async getValue(credentialId: string): Promise<string> {
    const credential = await this.credentialsRepository.findOne(credentialId);
    const decryptedValue = await this.encryptionService.decryptColumnValue(
      'credentials',
      'value',
      credential.valueCiphertext
    );
    return decryptedValue;
  }
}
