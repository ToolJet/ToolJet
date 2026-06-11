import { UserDetails } from '@entities/user_details.entity';
import { EncryptionService } from '@modules/encryption/service';
import { EntityManager } from 'typeorm';
import { IUserDetailsService } from '../interfaces/IUserDetailsService';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserDetailsService implements IUserDetailsService {
  constructor(protected readonly encryptionService: EncryptionService) {}

  async updateUserMetadata(
    manager: EntityManager,
    userId: string,
    organizationId: string,
    userMetadata: any
  ): Promise<void> {
    // Serialize and encrypt the entire metadata object
    const serializedMetadata = typeof userMetadata === 'object' ? JSON.stringify(userMetadata) : userMetadata;
    const encryptedMetadata = await this.encryptionService.encryptColumnValue(
      'user_details',
      'userMetadata',
      serializedMetadata
    );

    // Upsert the encrypted metadata
    await manager.upsert(
      UserDetails,
      {
        userId,
        organizationId,
        userMetadata: encryptedMetadata,
        updatedAt: new Date(),
      },
      ['userId', 'organizationId']
    );
  }
}
