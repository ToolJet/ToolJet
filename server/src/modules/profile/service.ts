import { Injectable } from '@nestjs/common';
import { UserRepository } from '@modules/users/repository';
import { ProfileUpdateDto } from '@modules/profile/dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { ProfileUtilService } from '@modules/profile/util.service';
import { User } from '@entities/user.entity';
import { IProfileService } from '@modules/profile/interfaces/IService';
import { File } from '@entities/file.entity';

@Injectable()
export class ProfileService implements IProfileService {
  constructor(protected userRepository: UserRepository, protected serviceUtils: ProfileUtilService) {}

  getSessionUserDetails(user: User): Partial<User> {
    const { firstName, lastName, avatarId, email, id } = user;
    return {
      firstName,
      lastName,
      avatarId,
      email,
      id,
    };
  }

  async addAvatar(userId: string, imageBuffer: Buffer, filename: string): Promise<File> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return this.serviceUtils.addAvatar(userId, imageBuffer, filename, manager);
    });
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    await this.userRepository.updateOne(userId, {
      password,
      passwordRetryCount: 0,
    });
  }

  async updateUserName(userId: string, updateUserDto: ProfileUpdateDto): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await this.serviceUtils.updateUserName(userId, updateUserDto, manager);
    });
  }
}
