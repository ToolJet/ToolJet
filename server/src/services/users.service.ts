import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { FilesService } from '../services/files.service';
import { App } from 'src/entities/app.entity';
import { EntityManager, Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { cleanObject, dbTransactionWrap } from 'src/helpers/utils.helper';
import { CreateFileDto } from '@dto/create-file.dto';
import { USER_STATUS, WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
import {
  GROUP_PERMISSIONS_TYPE,
  USER_ROLE,
} from '@module/user_resource_permissions/constants/group-permissions.constant';
import { GroupPermissionsServiceV2 } from './group_permissions.service.v2';
import { UserRoleService } from './user-role.service';
import { validateDeleteGroupUserOperation } from '@module/user_resource_permissions/utility/group-permissions.utility';
import { GroupPermissionsUtilityService } from '@module/user_resource_permissions/services/group-permissions.utility.service';
import { Organization } from 'src/entities/organization.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
const uuid = require('uuid');
const bcrypt = require('bcrypt');

@Injectable()
export class UsersService {
  //Whole user service wherever group permissions are used need to be changed
  constructor(
    private readonly filesService: FilesService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(App)
    private appsRepository: Repository<App>,

    private groupPermissionsService: GroupPermissionsServiceV2,
    private userRoleService: UserRoleService,
    private groupPermissionsUtilityService: GroupPermissionsUtilityService,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>
  ) {}

  async getCount(): Promise<number> {
    return this.usersRepository.count();
  }

  async getAppOrganizationDetails(app: App): Promise<Organization> {
    return this.organizationsRepository.findOneOrFail({
      select: ['id', 'slug'],
      where: { id: app.organizationId },
    });
  }

  async findOne(where = {}): Promise<User> {
    return this.usersRepository.findOne({ where });
  }

  async findByEmail(
    email: string,
    organizationId?: string,
    status?: string | Array<string>,
    manager?: EntityManager
  ): Promise<User> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (!organizationId) {
        return manager.findOne(User, {
          where: { email },
          relations: ['organization'],
        });
      } else {
        const statusList = status
          ? typeof status === 'object'
            ? status
            : [status]
          : [WORKSPACE_USER_STATUS.ACTIVE, WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ARCHIVED];
        return await manager
          .createQueryBuilder(User, 'users')
          .innerJoinAndSelect(
            'users.organizationUsers',
            'organization_users',
            'organization_users.organizationId = :organizationId',
            { organizationId }
          )
          .where('organization_users.status IN(:...statusList)', {
            statusList,
          })
          .andWhere('users.email = :email', { email })
          .getOne();
      }
    }, manager);
  }

  async findByPasswordResetToken(token: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { forgotPasswordToken: token },
    });
  }

  async create(
    userParams: Partial<User>,
    organizationId: string,
    role: USER_ROLE,
    existingUser?: User,
    isInvite?: boolean,
    defaultOrganizationId?: string,
    manager?: EntityManager
  ): Promise<User> {
    const { email, firstName, lastName, password, source, status, phoneNumber } = userParams;
    let user: User;

    await dbTransactionWrap(async (manager: EntityManager) => {
      if (!existingUser) {
        user = manager.create(User, {
          email,
          firstName,
          lastName,
          password,
          phoneNumber,
          source,
          status,
          invitationToken: isInvite ? uuid.v4() : null,
          defaultOrganizationId: defaultOrganizationId || organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await manager.save(user);
      } else {
        user = existingUser;
      }
      if (defaultOrganizationId) {
        await this.userRoleService.addUserRole(
          { role: USER_ROLE.ADMIN, userId: user.id },
          defaultOrganizationId,
          manager
        );
      }
      await this.userRoleService.addUserRole({ role, userId: user.id }, organizationId, manager);
    }, manager);

    return user;
  }

  async attachUserGroup(
    groups: string[],
    organizationId: string,
    userId: string,
    manager?: EntityManager
  ): Promise<void> {
    if (!groups) return;
    await dbTransactionWrap(async (manager: EntityManager) => {
      if (groups?.length)
        await this.groupPermissionsUtilityService.validateEditUserGroupPermissionsAddition(
          { userId, groupsToAddIds: groups, organizationId },
          manager
        );
      await Promise.all(
        groups.map(async (groupId) => {
          await this.groupPermissionsService.addGroupUsers(
            { userIds: [userId], groupId, allowRoleChange: false },
            organizationId,
            manager
          );
        })
      );
    }, manager);
  }

  async update(userId: string, params: any, manager?: EntityManager, organizationId?: string) {
    const { forgotPasswordToken, password, firstName, lastName, addGroups, removeGroups, source, role } = params;
    const hashedPassword = password ? bcrypt.hashSync(password, 10) : undefined;

    const updatableParams = {
      forgotPasswordToken,
      firstName,
      lastName,
      password: hashedPassword,
      source,
    };

    // removing keys with undefined values
    cleanObject(updatableParams);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(User, userId, updatableParams);
      const user = await manager.findOne(User, { where: { id: userId } });

      await this.removeUserGroupPermissionsIfExists(manager, user, removeGroups, organizationId);
      if (role) await this.userRoleService.editDefaultGroupUserRole({ userId, newRole: role }, organizationId, manager);
      await this.attachUserGroup(addGroups, organizationId, userId, manager);
      return user;
    }, manager);
  }

  async updateUser(userId: string, updatableParams: Partial<User>, manager?: EntityManager) {
    if (updatableParams.password) {
      updatableParams.password = bcrypt.hashSync(updatableParams.password, 10);
    }
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(User, userId, updatableParams);
    }, manager);
  }

  async removeUserGroupPermissionsIfExists(
    manager: EntityManager,
    user: User,
    removeGroups: string[],
    organizationId?: string
  ): Promise<void> {
    const orgId = organizationId || user.defaultOrganizationId;
    if (!removeGroups) return;
    await dbTransactionWrap(async (manager: EntityManager) => {
      const groupPermissions = await this.groupPermissionsService.getAllUserGroups(user.id, orgId);
      const groupsToRemove = groupPermissions.filter((permission) => removeGroups.includes(permission.id));
      await Promise.all(
        groupsToRemove.map(async (group) => {
          validateDeleteGroupUserOperation(group);
          const groupUser = group.groupUsers[0];
          this.groupPermissionsService.deleteGroupUser(groupUser.id, manager);
        })
      );
    }, manager);
  }

  async throwErrorIfUserIsLastActiveAdmin(user: User, organizationId: string) {
    const result = await this.groupPermissionsUtilityService.getRoleUsersList(USER_ROLE.ADMIN, organizationId);
    const allActiveAdmin = result.filter((admin) => admin.organizationUsers[0].status === USER_STATUS.ACTIVE);
    const isAdmin = allActiveAdmin.find((userItem) => userItem.id === user.id);

    if (isAdmin && allActiveAdmin.length < 2) throw new BadRequestException('Atleast one active admin is required');
  }

  async hasGroup(user: User, role: USER_ROLE, organizationId?: string, manager?: EntityManager): Promise<boolean> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const result = await manager
        .createQueryBuilder(GroupPermissions, 'group_permissions')
        .innerJoin('group_permissions.groupUsers', 'groupUsers')
        .where('group_permissions.organizationId = :organizationId', {
          organizationId: organizationId || user.organizationId,
        })
        .andWhere('group_permissions.name = :role ', { role })
        .andWhere('group_permissions.type = :type', { type: GROUP_PERMISSIONS_TYPE.DEFAULT })
        .andWhere('groupUsers.userId = :userId', { userId: user.id })
        .getCount();

      return result > 0;
    }, manager);
  }

  async returnOrgIdOfAnApp(slug: string): Promise<{ organizationId: string; isPublic: boolean }> {
    let app: App;
    try {
      app = await this.appsRepository.findOneOrFail(slug);
    } catch (error) {
      app = await this.appsRepository.findOne({
        slug,
      });
    }

    return { organizationId: app?.organizationId, isPublic: app?.isPublic };
  }

  async addAvatar(userId: number, imageBuffer: Buffer, filename: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const user = await manager.findOne(User, userId);
      const currentAvatarId = user.avatarId;
      const createFileDto = new CreateFileDto();
      createFileDto.filename = filename;
      createFileDto.data = imageBuffer;
      const avatar = await this.filesService.create(createFileDto, manager);

      await manager.update(User, userId, {
        avatarId: avatar.id,
      });

      if (currentAvatarId) {
        await this.filesService.remove(currentAvatarId, manager);
      }
      return avatar;
    });
  }
}
