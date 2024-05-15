import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { createQueryBuilder, DeepPartial, EntityManager, getRepository, Repository } from 'typeorm';
import { UsersService } from 'src/services/users.service';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';
import { Organization } from 'src/entities/organization.entity';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { dbTransactionWrap, isSuperAdmin } from 'src/helpers/utils.helper';
import { USER_STATUS, WORKSPACE_STATUS, WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
import { LicenseService } from './license.service';
import { LICENSE_FIELD, LICENSE_LIMIT } from 'src/helpers/license.helper';
import { UpdateUserDto } from '@dto/user.dto';
const uuid = require('uuid');

/* TYPES */
type InvitedUserType = Partial<User> & {
  invitedOrganizationId?: string;
  organizationStatus?: string;
};

@Injectable()
export class OrganizationUsersService {
  constructor(
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    private usersService: UsersService,
    private emailService: EmailService,
    private licenseService: LicenseService
  ) {}

  async create(
    user: User,
    organization: DeepPartial<Organization>,
    isInvite?: boolean,
    manager?: EntityManager
  ): Promise<OrganizationUser> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        manager.create(OrganizationUser, {
          userId: user.id,
          organization,
          invitationToken: isInvite ? uuid.v4() : null,
          status: isInvite ? WORKSPACE_USER_STATUS.INVITED : WORKSPACE_USER_STATUS.ACTIVE,
          role: 'all-users',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    }, manager);
  }

  async getOrganizationUser(organizationId: string, manager?: EntityManager) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(OrganizationUser, { where: { organizationId } });
    }, manager);
  }

  async changeRole(id: string, role: string) {
    const organizationUser = await this.organizationUsersRepository.findOne({ where: { id } });
    if (organizationUser.role == 'admin') {
      const lastActiveAdmin = await this.lastActiveAdmin(organizationUser.organizationId);

      if (lastActiveAdmin) {
        throw new BadRequestException('Atleast one active admin is required.');
      }
    }
    return await this.organizationUsersRepository.update(id, { role });
  }

  async findByWorkspaceInviteToken(invitationToken: string): Promise<InvitedUserType> {
    const organizationUser = await getRepository(OrganizationUser)
      .createQueryBuilder('organizationUser')
      .select([
        'organizationUser.organizationId',
        'organizationUser.invitationToken',
        'organizationUser.status',
        'user.id',
        'user.email',
        'user.invitationToken',
        'user.status',
        'user.firstName',
        'user.lastName',
        'user.source',
        'organization.status',
      ])
      .innerJoin('organizationUser.user', 'user')
      .innerJoin('organizationUser.organization', 'organization')
      .where('organizationUser.invitationToken = :invitationToken', { invitationToken })
      .getOne();

    if (organizationUser?.organization?.status === WORKSPACE_STATUS.ARCHIVE) {
      /* Invited workspace is archive */
      const errorResponse = {
        message: {
          error: 'The workspace is archived. Please contact the super admin to get access.',
          isWorkspaceArchived: true,
        },
      };
      throw new BadRequestException(errorResponse);
    }

    const user: InvitedUserType = organizationUser?.user;
    /* Invalid organization token */
    if (!user) {
      const errorResponse = {
        message: {
          error: 'Invalid invitation token. Please ensure that you have a valid invite url',
          isInvalidInvitationUrl: true,
        },
      };
      throw new BadRequestException(errorResponse);
    }
    user.invitedOrganizationId = organizationUser.organizationId;
    user.organizationStatus = organizationUser.status;
    return user;
  }

  async getActiveWorkspacesCount(userId: string) {
    return await this.organizationUsersRepository.count({
      where: {
        userId,
        status: WORKSPACE_USER_STATUS.ACTIVE,
      },
    });
  }

  async isTheUserIsAnActiveMemberOfTheWorkspace(userId: string, organizationId: string) {
    return await this.organizationUsersRepository.count({
      where: {
        userId,
        organizationId,
        status: WORKSPACE_USER_STATUS.ACTIVE,
      },
    });
  }

  async isAllWorkspacesArchivedBySuperAdmin(userId: string) {
    const archivedWorkspaceCount = await this.organizationUsersRepository.count({
      where: {
        userId,
        status: WORKSPACE_USER_STATUS.ARCHIVED,
      },
    });
    const allWorkspacesCount = await this.organizationUsersRepository.count({ userId });
    return allWorkspacesCount === archivedWorkspaceCount;
  }

  async updateOrgUser(organizationUserId: string, updateUserDto: UpdateUserDto) {
    const organizationUser = await this.organizationUsersRepository.findOne({ where: { id: organizationUserId } });
    return await this.usersService.update(
      organizationUser.userId,
      updateUserDto,
      null,
      organizationUser.organizationId
    );
  }

  async archive(id: string, organizationId: string, user?: User): Promise<void> {
    const organizationUser = await this.organizationUsersRepository.findOneOrFail({
      where: { id, organizationId },
      relations: ['user'],
    });

    !isSuperAdmin(user) &&
      (await this.usersService.throwErrorIfRemovingLastActiveAdmin(organizationUser?.user, undefined, organizationId));
    await this.organizationUsersRepository.update(id, {
      status: WORKSPACE_USER_STATUS.ARCHIVED,
      invitationToken: null,
    });
  }

  async archiveFromAll(userId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        OrganizationUser,
        { userId },
        { status: WORKSPACE_USER_STATUS.ARCHIVED, invitationToken: null }
      );
      await this.usersService.updateUser(userId, { status: USER_STATUS.ARCHIVED }, manager);
    });
  }

  async unarchiveUser(userId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.usersService.updateUser(userId, { status: USER_STATUS.ACTIVE }, manager);
    });
  }

  async unarchive(user: User, id: string, organizationId: string, manager?: EntityManager): Promise<void> {
    const organizationUser = await this.organizationUsersRepository.findOne({
      where: { id, organizationId },
      relations: ['user', 'organization'],
    });

    if (!(organizationUser && organizationUser.organization && organizationUser.user)) {
      throw new BadRequestException('User not exist');
    }
    if (organizationUser.status !== WORKSPACE_USER_STATUS.ARCHIVED) {
      throw new BadRequestException('User status must be archived to unarchive');
    }

    const invitationToken = uuid.v4();

    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(OrganizationUser, id, { status: WORKSPACE_USER_STATUS.INVITED, invitationToken });

      await this.usersService.updateUser(organizationUser.userId, { status: USER_STATUS.ACTIVE }, manager);
      await this.usersService.validateLicense(manager);
      await this.validateLicense(manager);
    }, manager);

    if (organizationUser.user.invitationToken) {
      /* User is not activated in instance level. Send setup/welcome email */
      this.emailService
        .sendWelcomeEmail(
          organizationUser.user.email,
          organizationUser.user.firstName,
          organizationUser.user.invitationToken,
          invitationToken,
          organizationUser.organizationId,
          organizationUser.organization.name,
          user.firstName
        )
        .catch((err) => console.error('Error while sending welcome mail', err));
      return;
    }

    this.emailService
      .sendOrganizationUserWelcomeEmail(
        organizationUser.user.email,
        organizationUser.user.firstName,
        user.firstName,
        invitationToken,
        organizationUser.organization.name,
        organizationUser.organizationId
      )
      .catch((err) => console.error('Error while sending welcome mail', err));

    return;
  }

  async activateOrganization(organizationUser: OrganizationUser, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(OrganizationUser, organizationUser.id, {
        status: WORKSPACE_USER_STATUS.ACTIVE,
        invitationToken: null,
      });
    }, manager);
  }

  async personalWorkspaceCount(userId: string): Promise<number> {
    const personalWorkspacesCount = await this.personalWorkspaces(userId);
    return personalWorkspacesCount?.length;
  }

  async personalWorkspaces(userId: string): Promise<OrganizationUser[]> {
    const personalWorkspaces: Partial<OrganizationUser[]> = await this.organizationUsersRepository.find({
      select: ['organizationId', 'invitationToken'],
      where: { userId },
    });
    const personalWorkspaceArray: OrganizationUser[] = [];
    for (const workspace of personalWorkspaces) {
      const { organizationId } = workspace;
      const workspaceOwner = await this.organizationUsersRepository.find({
        where: { organizationId },
        order: { createdAt: 'ASC' },
        take: 1,
      });
      if (workspaceOwner[0]?.userId === userId) {
        /* First user of the workspace = created by the user */
        personalWorkspaceArray.push(workspace);
      }
    }

    return personalWorkspaceArray;
  }

  async lastActiveAdmin(organizationId: string): Promise<boolean> {
    const adminsCount = await this.activeAdminCount(organizationId);

    return adminsCount <= 1;
  }

  async activeAdminCount(organizationId: string) {
    return await createQueryBuilder(GroupPermission, 'group_permissions')
      .innerJoin('group_permissions.userGroupPermission', 'user_group_permission')
      .where('group_permissions.group = :admin', { admin: 'admin' })
      .andWhere('group_permissions.organization = :organizationId', { organizationId })
      .getCount();
  }

  async organizationsCount(manager?: EntityManager) {
    return dbTransactionWrap(async (manager) => {
      return await manager
        .createQueryBuilder(Organization, 'organizations')
        .innerJoin(
          'organizations.organizationUsers',
          'organizationUsers',
          'organizationUsers.status IN(:...statusList)',
          {
            statusList: [WORKSPACE_USER_STATUS.ACTIVE, WORKSPACE_USER_STATUS.INVITED],
          }
        )
        .getCount();
    }, manager);
  }

  async validateLicense(manager: EntityManager): Promise<void> {
    const workspacesCount = await this.licenseService.getLicenseTerms(LICENSE_FIELD.WORKSPACES);

    if (workspacesCount === LICENSE_LIMIT.UNLIMITED) {
      return;
    }

    if ((await this.organizationsCount(manager)) > workspacesCount) {
      throw new HttpException('You have reached your limit for number of workspaces.', 451);
    }
  }
}
