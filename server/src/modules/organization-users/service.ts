import { Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { EntityManager } from 'typeorm';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { BadRequestException } from '@nestjs/common';
import { USER_STATUS, WORKSPACE_USER_SOURCE, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { dbTransactionWrap } from '@helpers/database.helper';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { GroupPermissionsUtilService } from '@modules/group-permissions/util.service';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { isSuperAdmin } from '@helpers/utils.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InviteNewUserDto } from '@modules/organization-users/dto/invite-new-user.dto';
const uuid = require('uuid');
import * as csv from 'fast-csv';
import { EMAIL_EVENTS } from '@modules/email/constants';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { LicenseOrganizationService } from '@modules/licensing/services/organization.service';
import { OrganizationUsersUtilService } from './util.service';
import { UserRepository } from '@modules/users/repository';
import { MAX_ROW_COUNT } from './constants';
import { isPlural } from '@helpers/utils.helper';
import { Response } from 'express';
import { UserCsvRow } from './interfaces';
import { IOrganizationUsersService } from './interfaces/IService';
import { UpdateOrgUserDto } from './dto';
@Injectable()
export class OrganizationUsersService implements IOrganizationUsersService {
  constructor(
    protected organizationUsersRepository: OrganizationUsersRepository,
    protected userRepository: UserRepository,
    protected licenseUserService: LicenseUserService,
    protected licenseOrganizationService: LicenseOrganizationService,
    protected groupPermissionsUtilService: GroupPermissionsUtilService,
    protected eventEmitter: EventEmitter2,
    protected organizationUsersUtilService: OrganizationUsersUtilService
  ) {}

  async updateOrgUser(organizationUserId: string, user: User, updateOrgUserDto: UpdateOrgUserDto) {
    const { firstName, lastName, addGroups, role, userMetadata } = updateOrgUserDto;

    const organizationUser = await this.organizationUsersRepository.findOne({
      where: { id: organizationUserId, organizationId: user.organizationId },
    });
    return dbTransactionWrap(async (manager: EntityManager) => {
      // Step 1 - Update user details - Only super admin can
      if (isSuperAdmin(user)) {
        await this.organizationUsersUtilService.updateUserDetails(
          organizationUser.userId,
          { firstName, lastName },
          manager
        );
      }

      // Step 2 - Roles and groups update
      await this.organizationUsersUtilService.handleGroupsAndRoleChanges(
        {
          id: organizationUser.userId,
        },
        user.organizationId,
        {
          addGroups,
          role,
          adminId: user.id,
        },
        manager
      );

      // Step 3 - Update user metadata
      await this.organizationUsersUtilService.updateUserMetadata(
        manager,
        organizationUser.userId,
        organizationUser.organizationId,
        userMetadata
      );

      // Step 4 - validate license
      await this.licenseUserService.validateUser(manager);
      return;
    });
  }

  async archive(id: string, organizationId: string, user?: User): Promise<void> {
    const organizationUser = await this.organizationUsersRepository.findOneOrFail({
      where: { id, organizationId },
      relations: ['user'],
    });

    await this.organizationUsersUtilService.throwErrorIfUserIsLastActiveAdmin(organizationUser?.user, organizationId);
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
      await this.organizationUsersUtilService.updateUserStatus(userId, USER_STATUS.ARCHIVED, manager);
    });
  }

  async unarchiveUser(userId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const targetUser = await manager.findOneOrFail(User, {
        where: { id: userId },
        select: ['id', 'status', 'invitationToken', 'source'],
      });
      const { status, invitationToken } = targetUser;
      /* Special case. what if the user is archived when the status is invited. we were changing status to active before */
      const updatedStatus =
        !!invitationToken && status === USER_STATUS.ARCHIVED ? USER_STATUS.INVITED : USER_STATUS.ACTIVE;
      await this.organizationUsersUtilService.updateUserStatus(userId, updatedStatus, manager);
      await this.licenseUserService.validateUser(manager);
      await this.licenseOrganizationService.validateOrganization(manager);
    });
  }

  async unarchive(user: User, id: string, organizationId: string): Promise<void> {
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
      await manager.update(OrganizationUser, id, {
        status: WORKSPACE_USER_STATUS.INVITED,
        source: WORKSPACE_USER_SOURCE.INVITE,
        invitationToken,
      });

      await this.licenseUserService.validateUser(manager);
      await this.licenseOrganizationService.validateOrganization(manager);
    });

    if (organizationUser.user.invitationToken) {
      /* User is not activated in instance level. Send setup/welcome email */
      this.eventEmitter.emit('emailEvent', {
        type: EMAIL_EVENTS.SEND_WELCOME_EMAIL,
        payload: {
          to: organizationUser.user.email,
          name: organizationUser.user.firstName,
          invitationtoken: organizationUser.user.invitationToken,
          organizationInvitationToken: invitationToken,
          organizationId: organizationUser.organizationId,
          organizationName: organizationUser.organization.name,
          sender: user.firstName,
        },
      });
      return;
    }

    this.eventEmitter.emit('emailEvent', {
      type: EMAIL_EVENTS.SEND_ORGANIZATION_USER_WELCOME_EMAIL,
      payload: {
        to: organizationUser.user.email,
        name: organizationUser.user.firstName,
        sender: user.firstName,
        invitationtoken: invitationToken,
        organizationName: organizationUser.organization.name,
        organizationId: organizationUser.organizationId,
      },
    });

    return;
  }

  async inviteNewUser(currentUser: User, inviteNewUserDto: InviteNewUserDto) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await this.organizationUsersUtilService.inviteNewUser(currentUser, inviteNewUserDto, manager);
    });
  }

  async bulkUploadUsers(currentUser: User, fileStream, res: Response) {
    const users = [];
    const existingUsers = [];
    const archivedUsers = [];
    const invalidRows = [];
    const invalidFields = new Set();
    let invalidGroups = [];
    const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    const invalidRoles = [];
    const groupPermissions = (
      await this.groupPermissionsUtilService.getAllGroupByOrganization(currentUser.organizationId)
    ).groupPermissions?.filter((gp) => !gp.disabled);
    const existingGroups = groupPermissions.map((groupPermission) => groupPermission.name);
    csv
      .parseString(fileStream.toString(), {
        headers: ['first_name', 'last_name', 'email', 'user_role', 'groups', 'metadata'],
        renameHeaders: true,
        ignoreEmpty: true,
      })
      .transform((row: UserCsvRow, next) => {
        const groupNames = this.organizationUsersUtilService.createGroupsList(row?.groups);
        invalidGroups = [...invalidGroups, ...groupNames.filter((group) => !existingGroups.includes(group))];
        const groups = groupPermissions.filter((group) => groupNames.includes(group.name)).map((group) => group.id);
        return next(null, {
          ...row,
          groups: groups,
          user_role: this.organizationUsersUtilService.convertUserRolesCasing(row?.user_role),
          userMetadata: row?.metadata ? JSON.parse(row.metadata) : null,
          email: row?.email?.toLowerCase(),
        });
      })
      .validate(async (data: UserCsvRow, next) => {
        await dbTransactionWrap(async (manager: EntityManager) => {
          //Check for existing users
          let isInvalidRole = false;

          const user = await this.userRepository.findByEmail(data?.email, undefined, undefined, manager);

          if (user?.status === USER_STATUS.ARCHIVED) {
            archivedUsers.push(data?.email);
          } else if (user?.organizationUsers?.some((ou) => ou.organizationId === currentUser.organizationId)) {
            existingUsers.push(data?.email);
          } else {
            const user = {
              firstName: data?.first_name,
              lastName: data?.last_name,
              email: data?.email,
              role: data?.user_role,
              groups: data?.groups,
              userMetadata: data?.metadata,
            };
            users.push(user);
          }

          //Check for invalid groups

          if (!Object.values(USER_ROLE).includes(data?.user_role as USER_ROLE)) {
            invalidRoles.push(data?.user_role);
            isInvalidRole = true;
          }

          data.first_name = data.first_name?.trim();
          data.last_name = data.last_name?.trim();

          const isValidName = data.first_name !== '' || data.last_name !== '';
          return next(null, isValidName && emailPattern.test(data.email) && !isInvalidRole);
        });
      })
      .on('data', function () {})
      .on('data-invalid', (row, rowNumber) => {
        const invalidField = Object.keys(row).filter((key) => {
          if (Array.isArray(row[key])) {
            return row[key].length === 0;
          }
          return !row[key] || row[key] === '';
        });
        invalidRows.push(rowNumber);
        invalidFields.add(invalidField);
      })
      .on('end', async (rowCount: number) => {
        try {
          if (rowCount > MAX_ROW_COUNT) {
            throw new BadRequestException('Row count cannot be greater than 500');
          }

          if (invalidRows.length) {
            const invalidFieldsArray = invalidFields.entries().next().value[1];
            const errorMsg = `Missing ${[invalidFieldsArray.join(',')]} information in ${
              invalidRows.length
            } row(s);. No users were uploaded, please update and try again.`;
            throw new BadRequestException(errorMsg);
          }

          if (invalidGroups.length) {
            throw new BadRequestException(
              `${invalidGroups.length} group${isPlural(invalidGroups)} doesn't exist. No users were uploaded`
            );
          }

          if (invalidRoles.length > 0) {
            throw new BadRequestException('Invalid role present for the users');
          }

          if (archivedUsers.length) {
            throw new BadRequestException(
              `User${isPlural(archivedUsers)} with email ${archivedUsers.join(
                ', '
              )} is archived. No users were uploaded`
            );
          }

          if (existingUsers.length) {
            throw new BadRequestException(
              `${existingUsers.length} users with same email already exist. No users were uploaded `
            );
          }

          if (users.length === 0) {
            throw new BadRequestException('No users were uploaded');
          }

          if (users.length > 250) {
            throw new BadRequestException(`You can only invite 250 users at a time`);
          }

          await this.organizationUsersUtilService.inviteUserswrapper(users, currentUser);
          res.status(201).send({ message: `${rowCount} user${isPlural(users)} are being added` });
        } catch (error) {
          const { status, response } = error;
          if (status === 451) {
            res.status(status).send({ message: response, statusCode: status });
            return;
          }
          res.status(status).send(JSON.stringify(response));
        }
      })
      .on('error', (error) => {
        throw error.message;
      });
  }

  async fetchUsersByValue(organizationId: string, searchInput: string) {
    return await this.organizationUsersRepository.fetchUsersByValue(organizationId, searchInput);
  }

  async getUsers(user, query) {
    const { page, searchText, status } = query;
    const filterOptions = {
      ...(searchText && { searchText }),
      ...(status && { status }),
    };

    const { organizationUsers: users, total: usersCount } = await this.organizationUsersUtilService.fetchUsers(
      user,
      filterOptions,
      page
    );

    const meta = {
      total_pages: Math.ceil(usersCount / 10),
      total_count: usersCount,
      current_page: parseInt(page || 1),
    };

    return { meta, users };
  }
}
