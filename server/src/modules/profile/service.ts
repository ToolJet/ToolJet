import { Injectable } from '@nestjs/common';
import { UserRepository } from '@modules/users/repository';
import { ProfileUpdateDto } from '@modules/profile/dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { ProfileUtilService } from '@modules/profile/util.service';
import { User } from '@entities/user.entity';
import { IProfileService } from '@modules/profile/interfaces/IService';
import { File } from '@entities/file.entity';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';

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
      const user = await this.userRepository.getUser({
        id: userId,
      });
      const avatar = await this.serviceUtils.addAvatar(userId, imageBuffer, filename, manager);
      const auditLogData = {
        userId: user.id,
        organizationId: user.defaultOrganizationId,
        resourceId: user.id,
        resourceName: user.email,
        resourceData: {
          previous_user_details: {
            avatar_id: user.avatarId,
          },
          updated_user_details: {
            avatar_id: avatar.id,
          },
        },
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogData);
      return avatar;
    });
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const user = await manager.findOneOrFail(User, {
        where: { id: userId },
      });
      await this.userRepository.updateOne(
        userId,
        {
          password,
          passwordRetryCount: 0,
        },
        manager
      );
      const auditLogEntry = {
        userId: user.id,
        organizationId: user.defaultOrganizationId,
        resourceId: user.id,
        resourceName: user.email,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogEntry);
    });
  }

  async updateUserName(userId: string, updateUserDto: ProfileUpdateDto): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const user = await manager.findOneOrFail(User, {
        where: { id: userId },
      });
      const { first_name: firstName, last_name: lastName } = updateUserDto;
      await this.userRepository.updateOne(userId, { firstName, lastName }, manager);
      const auditLogData = {
        userId: user.id,
        organizationId: user.defaultOrganizationId,
        resourceId: user.id,
        resourceName: user.email,
        resourceData: {
          previous_user_details: {
            first_name: user.firstName,
            last_name: user.lastName,
          },
          updated_user_details: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogData);
    });
  }
}
