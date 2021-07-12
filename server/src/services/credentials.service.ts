import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from 'src/entities/credential.entity';
import { Repository } from 'typeorm';
import { EncryptionService } from './encryption.service';
const crypto = require('crypto')

@Injectable()
export class CredentialsService {

  constructor(
    private encryptionService: EncryptionService,
    @InjectRepository(Credential)
    private credentialsRepository: Repository<Credential>,
  ) { }

  async create(value: string): Promise<Credential> {
    const newCredential = this.credentialsRepository.create({
      valueCiphertext: await this.encryptionService.encryptColumnValue('credentials', 'value', value),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const credential = await this.credentialsRepository.save(newCredential);
    return credential;
  }
}
