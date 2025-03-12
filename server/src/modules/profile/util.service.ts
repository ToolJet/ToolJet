import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UserRepository } from '@modules/users/repository';
import { FilesRepository } from '@modules/files/repository';
import { File } from '@entities/file.entity';
import { IProfileUtilService } from '@modules/profile/interfaces/IService';
import { CreateFileDto } from '@modules/files/dto/index';

@Injectable()
export class ProfileUtilService implements IProfileUtilService {
  constructor(protected readonly filesRepository: FilesRepository, protected userRepository: UserRepository) {}

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
}
