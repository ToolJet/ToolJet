import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UserRepository } from '@modules/users/repository';
import { FilesRepository } from '@modules/files/repository';
import { File } from '@entities/file.entity';
import { IProfileUtilService } from '@modules/profile/interfaces/IService';
import { CreateFileDto } from '@modules/files/dto/index';
import { ProfileUpdateDto } from './dto';
import { User } from '@entities/user.entity';

@Injectable()
export class ProfileUtilService implements IProfileUtilService {
  constructor(protected readonly filesRepository: FilesRepository, protected readonly userRepository: UserRepository) {}

  async addAvatar(userId: string, imageBuffer: Buffer, filename: string, manager?: EntityManager): Promise<File> {
    const user = await this.userRepository.getUser({
      id: userId,
    });
    const currentAvatarId = user.avatarId;
    const createFileDto = new CreateFileDto();
    createFileDto.filename = filename;
    createFileDto.data = imageBuffer;
    const avatar = await this.filesRepository.createOne(createFileDto, manager);

    await this.userRepository.updateOne(
      userId,
      {
        avatarId: avatar.id,
      },
      manager
    );

    if (currentAvatarId) {
      await this.filesRepository.removeOne(currentAvatarId, manager);
    }

    return avatar;
  }

  async updateUserName(userId: string, updateUserDto: ProfileUpdateDto, manager: EntityManager): Promise<void> {
    const { first_name: firstName, last_name: lastName } = updateUserDto;
    await manager.update(User, { id: userId }, { firstName, lastName });
  }

  async updateUserPassword(userId: string, password: string, manager: EntityManager): Promise<void> {
    await manager.update(
      User,
      { id: userId },
      {
        password,
        passwordRetryCount: 0,
      }
    );
  }
}
