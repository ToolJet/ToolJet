import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UserRepository } from '@modules/users/repository';
import { FilesRepository } from '@modules/files/repository';
import { File } from '@entities/file.entity';
import { IProfileUtilService } from '@modules/profile/interfaces/IService';
import { CreateFileDto } from '@modules/files/dto/index';
import { ProfileUpdateDto } from './dto';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { User } from '@entities/user.entity';

@Injectable()
export class ProfileUtilService implements IProfileUtilService {
  constructor(protected readonly filesRepository: FilesRepository, protected readonly userRepository: UserRepository) {}

  private async setAuditLogForUser(user: User, resourceData?: any): Promise<void> {
    const auditLogEntry = {
      userId: user.id,
      organizationId: user.defaultOrganizationId,
      resourceId: user.id,
      resourceName: user.email,
      resourceData: resourceData,
    };
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogEntry);
  }

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

    const resourceData = {
      previous_user_details: {
        avatar_id: currentAvatarId,
      },
      updatedUserDetails: {
        avatar_id: avatar.id,
      },
    };
    await this.setAuditLogForUser(user, resourceData);
    return avatar;
  }

  async updateUserName(userId: string, updateUserDto: ProfileUpdateDto, manager: EntityManager): Promise<void> {
    const { first_name: firstName, last_name: lastName } = updateUserDto;
    const user = await manager.findOneOrFail(User, {
      where: { id: userId },
    });

    await manager.update(User, { id: userId }, { firstName, lastName });
    const resourceData = {
      previous_user_details: {
        first_name: user.firstName,
        last_name: user.lastName,
      },
      updatedUserDetails: {
        first_name: firstName,
        last_name: lastName,
      },
    };
    await this.setAuditLogForUser(user, resourceData);
  }

  async updateUserPassword(userId: string, password: string, manager: EntityManager): Promise<void> {
    const user = await manager.findOneOrFail(User, {
      where: { id: userId },
    });
    await manager.update(
      User,
      { id: userId },
      {
        password,
        passwordRetryCount: 0,
      }
    );
    await this.setAuditLogForUser(user);
  }
}
