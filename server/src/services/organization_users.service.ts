import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { UsersService } from 'src/services/users.service';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';
import { Organization } from 'src/entities/organization.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { WORKSPACE_USER_SOURCE, WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
const uuid = require('uuid');

/* TYPES */
type InvitedUserType = Partial<User> & {
  invitedOrganizationId?: string;
  organizationStatus?: string;
  organizationUserSource?: string;
};

@Injectable()
export class OrganizationUsersService {
  constructor(
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    private usersService: UsersService,
    private emailService: EmailService,
    private readonly _dataSource: DataSource
  ) {}

  async create(
    user: User,
    organization: DeepPartial<Organization>,
    isInvite?: boolean,
    manager?: EntityManager,
    source: WORKSPACE_USER_SOURCE = WORKSPACE_USER_SOURCE.INVITE
  ): Promise<OrganizationUser> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        manager.create(OrganizationUser, {
          user,
          organization,
          invitationToken: isInvite ? uuid.v4() : null,
          status: isInvite ? WORKSPACE_USER_STATUS.INVITED : WORKSPACE_USER_STATUS.ACTIVE,
          source,
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

  async findByWorkspaceInviteToken(invitationToken: string): Promise<InvitedUserType> {
    const organizationUser = await this._dataSource
      .getRepository(OrganizationUser)
      .createQueryBuilder('organizationUser')
      .select([
        'organizationUser.organizationId',
        'organizationUser.invitationToken',
        'organizationUser.source',
        'organizationUser.status',
        'user.id',
        'user.email',
        'user.invitationToken',
        'user.status',
        'user.firstName',
        'user.lastName',
        'user.source',
      ])
      .innerJoin('organizationUser.user', 'user')
      .where('organizationUser.invitationToken = :invitationToken', { invitationToken })
      .getOne();

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
    user.organizationUserSource = organizationUser.source;
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

  async updateOrgUser(organizationUserId: string, updateUserDto, adminId: string) {
    const organizationUser = await this.organizationUsersRepository.findOne({ where: { id: organizationUserId } });
    await this.usersService.update(
      organizationUser.userId,
      updateUserDto,
      null,
      organizationUser.organizationId,
      adminId
    );
  }

  async archive(id: string, organizationId: string): Promise<void> {
    const organizationUser = await this.organizationUsersRepository.findOneOrFail({
      where: { id, organizationId },
      relations: ['user'],
    });

    await this.usersService.throwErrorIfUserIsLastActiveAdmin(organizationUser?.user, organizationId);
    await this.organizationUsersRepository.update(id, {
      status: WORKSPACE_USER_STATUS.ARCHIVED,
      invitationToken: null,
    });
  }

  async unarchive(user: User, id: string, manager?: EntityManager): Promise<void> {
    const organizationUser = await this.organizationUsersRepository.findOne({
      where: { id, organizationId: user.organizationId },
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
      await manager.update(OrganizationUser, id, {
        status: WORKSPACE_USER_STATUS.INVITED,
        source: WORKSPACE_USER_SOURCE.INVITE,
        invitationToken,
      });
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

  async getUser(token: string) {
    return await this.organizationUsersRepository.findOneOrFail({
      where: { invitationToken: token },
      relations: ['user'],
    });
  }
}
