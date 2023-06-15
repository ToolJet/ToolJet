import { BadRequestException, Injectable } from '@nestjs/common';
import * as csv from 'fast-csv';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { User } from 'src/entities/user.entity';
import { catchDbException, cleanObject, dbTransactionWrap, isPlural, generateNextName } from 'src/helpers/utils.helper';
import { Brackets, createQueryBuilder, DeepPartial, EntityManager, getManager, Repository } from 'typeorm';
import { OrganizationUser } from '../entities/organization_user.entity';
import { EmailService } from './email.service';
import { EncryptionService } from './encryption.service';
import { GroupPermissionsService } from './group_permissions.service';
import { OrganizationUsersService } from './organization_users.service';
import { UsersService } from './users.service';
import { InviteNewUserDto } from '@dto/invite-new-user.dto';
import { ConfigService } from '@nestjs/config';
import {
  getUserErrorMessages,
  getUserStatusAndSource,
  lifecycleEvents,
  USER_STATUS,
  WORKSPACE_USER_STATUS,
} from 'src/helpers/user_lifecycle';
import { decamelize } from 'humps';
import { Response } from 'express';
import { AppEnvironmentService } from './app_environments.service';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';

const MAX_ROW_COUNT = 500;

type FetchUserResponse = {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  id: string;
  status: string;
  invitationToken?: string;
  accountSetupToken?: string;
};

type UserFilterOptions = { searchText?: string; status?: string };

interface UserCsvRow {
  first_name: string;
  last_name: string;
  email: string;
  groups?: any;
}
@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(SSOConfigs)
    private ssoConfigRepository: Repository<SSOConfigs>,
    private usersService: UsersService,
    private organizationUserService: OrganizationUsersService,
    private groupPermissionService: GroupPermissionsService,
    private appEnvironmentService: AppEnvironmentService,
    private encryptionService: EncryptionService,
    private emailService: EmailService,
    private configService: ConfigService
  ) {}

  async create(name: string, user?: User, manager?: EntityManager): Promise<Organization> {
    let organization: Organization;
    await dbTransactionWrap(async (manager: EntityManager) => {
      organization = await catchDbException(
        async () => {
          return await manager.save(
            manager.create(Organization, {
              ssoConfigs: [
                {
                  sso: 'form',
                  enabled: true,
                },
              ],
              name,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          );
        },
        DataBaseConstraints.WORKSPACE_NAME_UNIQUE,
        'This workspace name is already taken.'
      );

      await this.appEnvironmentService.createDefaultEnvironments(organization.id, manager);

      const createdGroupPermissions: GroupPermission[] = await this.createDefaultGroupPermissionsForOrganization(
        organization,
        manager
      );

      if (user) {
        await this.organizationUserService.create(user, organization, false, manager);

        for (const groupPermission of createdGroupPermissions) {
          await this.groupPermissionService.createUserGroupPermission(user.id, groupPermission.id, manager);
        }
      }
    }, manager);

    return organization;
  }

  constructSSOConfigs() {
    return {
      google: {
        enabled: !!this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID'),
        configs: {
          client_id: this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID'),
        },
      },
      git: {
        enabled: !!this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID'),
        configs: {
          client_id: this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID'),
          host_name: this.configService.get<string>('SSO_GIT_OAUTH2_HOST'),
        },
      },
      form: {
        enable_sign_up: this.configService.get<string>('DISABLE_SIGNUPS') !== 'true',
        enabled: true,
      },
      enableSignUp: this.configService.get<string>('SSO_DISABLE_SIGNUPS') !== 'true',
    };
  }

  async get(id: string): Promise<Organization> {
    return await this.organizationsRepository.findOne({ where: { id }, relations: ['ssoConfigs'] });
  }

  async getSingleOrganization(): Promise<Organization> {
    return await this.organizationsRepository.findOne({ relations: ['ssoConfigs'] });
  }

  async createDefaultGroupPermissionsForOrganization(organization: Organization, manager?: EntityManager) {
    const defaultGroups = ['all_users', 'admin'];

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const createdGroupPermissions: GroupPermission[] = [];
      for (const group of defaultGroups) {
        const isAdmin = group === 'admin';
        const groupPermission = manager.create(GroupPermission, {
          organizationId: organization.id,
          group: group,
          appCreate: isAdmin,
          appDelete: isAdmin,
          folderCreate: isAdmin,
          orgEnvironmentVariableCreate: isAdmin,
          orgEnvironmentVariableUpdate: isAdmin,
          orgEnvironmentVariableDelete: isAdmin,
          folderUpdate: isAdmin,
          folderDelete: isAdmin,
        });
        await manager.save(groupPermission);
        createdGroupPermissions.push(groupPermission);
      }
      return createdGroupPermissions;
    }, manager);
  }

  async fetchUsersByValue(user: User, searchInput: string): Promise<any> {
    if (!searchInput) {
      return [];
    }
    const options = {
      searchText: searchInput,
    };
    const organizationUsers = await this.organizationUsersQuery(user.organizationId, options, 'or')
      .orderBy('user.firstName', 'ASC')
      .getMany();

    return organizationUsers?.map((orgUser) => {
      return {
        email: orgUser.user.email,
        firstName: orgUser.user?.firstName,
        lastName: orgUser.user?.lastName,
        name: `${orgUser.user?.firstName} ${orgUser.user?.lastName}`,
        id: orgUser.id,
        userId: orgUser.user.id,
      };
    });
  }

  organizationUsersQuery(organizationId: string, options: UserFilterOptions, condition?: 'and' | 'or') {
    const defaultConditions = () => {
      return new Brackets((qb) => {
        if (options?.searchText)
          qb.orWhere('lower(user.email) like :email', {
            email: `%${options?.searchText.toLowerCase()}%`,
          });
        if (options?.searchText)
          qb.orWhere('lower(user.firstName) like :firstName', {
            firstName: `%${options?.searchText.toLowerCase()}%`,
          });
        if (options?.searchText)
          qb.orWhere('lower(user.lastName) like :lastName', {
            lastName: `%${options?.searchText.toLowerCase()}%`,
          });
      });
    };

    const getOrConditions = () => {
      return new Brackets((qb) => {
        if (options?.status)
          qb.orWhere('organization_user.status = :status', {
            status: `${options?.status}`,
          });
      });
    };
    const getAndConditions = () => {
      return new Brackets((qb) => {
        if (options?.status)
          qb.andWhere('organization_user.status = :status', {
            status: `${options?.status}`,
          });
      });
    };
    const query = createQueryBuilder(OrganizationUser, 'organization_user')
      .innerJoinAndSelect('organization_user.user', 'user')
      .where('organization_user.organization_id = :organizationId', {
        organizationId,
      })
      .andWhere(defaultConditions());
    query.andWhere(condition === 'and' ? getAndConditions() : getOrConditions());
    return query;
  }

  async fetchUsers(user: User, page: number, options: UserFilterOptions): Promise<FetchUserResponse[]> {
    const condition = options?.searchText ? 'and' : 'or';
    const organizationUsers = await this.organizationUsersQuery(user.organizationId, options, condition)
      .orderBy('user.firstName', 'ASC')
      .take(10)
      .skip(10 * (page - 1))
      .getMany();

    return organizationUsers?.map((orgUser) => {
      return {
        email: orgUser.user.email,
        firstName: orgUser.user.firstName ?? '',
        lastName: orgUser.user.lastName ?? '',
        name: `${orgUser.user.firstName ?? ''} ${orgUser.user.lastName ?? ''}`,
        id: orgUser.id,
        userId: orgUser.user.id,
        role: orgUser.role,
        status: orgUser.status,
        avatarId: orgUser.user.avatarId,
        ...(orgUser.invitationToken ? { invitationToken: orgUser.invitationToken } : {}),
        ...(this.configService.get<string>('HIDE_ACCOUNT_SETUP_LINK') !== 'true' && orgUser.user.invitationToken
          ? { accountSetupToken: orgUser.user.invitationToken }
          : {}),
      };
    });
  }

  async usersCount(user: User, options: UserFilterOptions): Promise<number> {
    const condition = options?.searchText ? 'and' : 'or';
    return await this.organizationUsersQuery(user.organizationId, options, condition).getCount();
  }

  async fetchOrganizations(user: any): Promise<Organization[]> {
    return await createQueryBuilder(Organization, 'organization')
      .innerJoin(
        'organization.organizationUsers',
        'organization_users',
        'organization_users.status IN(:...statusList)',
        {
          statusList: [WORKSPACE_USER_STATUS.ACTIVE],
        }
      )
      .andWhere('organization_users.userId = :userId', {
        userId: user.id,
      })
      .orderBy('name', 'ASC')
      .getMany();
  }

  async findOrganizationWithLoginSupport(
    user: User,
    loginType: string,
    status?: string | Array<string>
  ): Promise<Organization[]> {
    const statusList = status ? (typeof status === 'object' ? status : [status]) : [WORKSPACE_USER_STATUS.ACTIVE];

    const query = createQueryBuilder(Organization, 'organization')
      .innerJoin('organization.ssoConfigs', 'organization_sso', 'organization_sso.sso = :form', {
        form: 'form',
      })
      .innerJoin(
        'organization.organizationUsers',
        'organization_users',
        'organization_users.status IN(:...statusList)',
        {
          statusList,
        }
      );

    if (loginType === 'form') {
      query.where('organization_sso.enabled = :enabled', {
        enabled: true,
      });
    } else if (loginType === 'sso') {
      query.where('organization.inheritSSO = :inheritSSO', {
        inheritSSO: true,
      });
    } else {
      return;
    }

    return await query
      .andWhere('organization_users.userId = :userId', {
        userId: user.id,
      })
      .orderBy('name', 'ASC')
      .getMany();
  }

  async getSSOConfigs(organizationId: string, sso: string): Promise<Organization> {
    return await createQueryBuilder(Organization, 'organization')
      .leftJoinAndSelect('organization.ssoConfigs', 'organisation_sso', 'organisation_sso.sso = :sso', {
        sso,
      })
      .andWhere('organization.id = :organizationId', {
        organizationId,
      })
      .getOne();
  }

  async fetchOrganizationDetails(
    organizationId: string,
    statusList?: Array<boolean>,
    isHideSensitiveData?: boolean,
    addInstanceLevelSSO?: boolean
  ): Promise<DeepPartial<Organization>> {
    const result: DeepPartial<Organization> = await createQueryBuilder(Organization, 'organization')
      .leftJoinAndSelect(
        'organization.ssoConfigs',
        'organisation_sso',
        'organisation_sso.enabled IN (:...statusList)',
        {
          statusList: statusList || [true, false], // Return enabled and disabled sso if status list not passed
        }
      )
      .andWhere('organization.id = :organizationId', {
        organizationId,
      })
      .getOne();

    if (!result) return;

    if (addInstanceLevelSSO && result.inheritSSO) {
      if (
        this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID') &&
        !result.ssoConfigs?.some((config) => config.sso === 'google')
      ) {
        if (!result.ssoConfigs) {
          result.ssoConfigs = [];
        }
        result.ssoConfigs.push({
          sso: 'google',
          enabled: true,
          configs: {
            clientId: this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID'),
          },
        });
      }
      if (
        this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID') &&
        !result.ssoConfigs?.some((config) => config.sso === 'git')
      ) {
        if (!result.ssoConfigs) {
          result.ssoConfigs = [];
        }
        result.ssoConfigs.push({
          sso: 'git',
          enabled: true,
          configs: {
            clientId: this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID'),
            clientSecret: await this.encryptionService.encryptColumnValue(
              'ssoConfigs',
              'clientSecret',
              this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_SECRET')
            ),
            hostName: this.configService.get<string>('SSO_GIT_OAUTH2_HOST'),
          },
        });
      }
    }

    if (!isHideSensitiveData) {
      if (!(result?.ssoConfigs?.length > 0)) {
        return;
      }
      for (const sso of result?.ssoConfigs) {
        await this.decryptSecret(sso?.configs);
      }
      return result;
    }
    return this.hideSSOSensitiveData(result?.ssoConfigs, result?.name, result?.enableSignUp);
  }

  private hideSSOSensitiveData(ssoConfigs: DeepPartial<SSOConfigs>[], organizationName, enableSignUp): any {
    const configs = { name: organizationName, enableSignUp };
    if (ssoConfigs?.length > 0) {
      for (const config of ssoConfigs) {
        const configId = config['id'];
        delete config['id'];
        delete config['organizationId'];
        delete config['createdAt'];
        delete config['updatedAt'];

        configs[config.sso] = this.buildConfigs(config, configId);
      }
    }
    return configs;
  }

  private buildConfigs(config: any, configId: string) {
    if (!config) return config;
    return {
      ...config,
      configs: {
        ...(config?.configs || {}),
        ...(config?.configs ? { clientSecret: '' } : {}),
      },
      configId,
    };
  }

  private async encryptSecret(configs) {
    if (!configs || typeof configs !== 'object') return configs;
    await Promise.all(
      Object.keys(configs).map(async (key) => {
        if (key.toLowerCase().includes('secret')) {
          if (configs[key]) {
            configs[key] = await this.encryptionService.encryptColumnValue('ssoConfigs', key, configs[key]);
          }
        }
      })
    );
  }

  private async decryptSecret(configs) {
    if (!configs || typeof configs !== 'object') return configs;
    await Promise.all(
      Object.keys(configs).map(async (key) => {
        if (key.toLowerCase().includes('secret')) {
          if (configs[key]) {
            configs[key] = await this.encryptionService.decryptColumnValue('ssoConfigs', key, configs[key]);
          }
        }
      })
    );
  }

  async updateOrganization(organizationId: string, params) {
    const { name, domain, enableSignUp, inheritSSO } = params;

    const updatableParams = {
      name,
      domain,
      enableSignUp,
      inheritSSO,
    };

    // removing keys with undefined values
    cleanObject(updatableParams);

    return await catchDbException(
      async () => {
        return await this.organizationsRepository.update(organizationId, updatableParams);
      },
      DataBaseConstraints.WORKSPACE_NAME_UNIQUE,
      'This workspace name is already taken.'
    );
  }

  async updateOrganizationConfigs(organizationId: string, params: any) {
    const { type, configs, enabled } = params;

    if (!(type && ['git', 'google', 'form'].includes(type))) {
      throw new BadRequestException();
    }

    await this.encryptSecret(configs);
    const organization: Organization = await this.getSSOConfigs(organizationId, type);

    if (organization?.ssoConfigs?.length > 0) {
      const ssoConfigs: SSOConfigs = organization.ssoConfigs[0];

      const updatableParams = {
        configs,
        enabled,
      };

      // removing keys with undefined values
      cleanObject(updatableParams);
      return await this.ssoConfigRepository.update(ssoConfigs.id, updatableParams);
    } else {
      const newSSOConfigs = this.ssoConfigRepository.create({
        organization,
        sso: type,
        configs,
        enabled: !!enabled,
      });
      return await this.ssoConfigRepository.save(newSSOConfigs);
    }
  }

  async getConfigs(id: string): Promise<SSOConfigs> {
    const result: SSOConfigs = await this.ssoConfigRepository.findOne({
      where: { id, enabled: true },
      relations: ['organization'],
    });
    await this.decryptSecret(result?.configs);
    return result;
  }

  async inviteNewUser(
    currentUser: User,
    inviteNewUserDto: InviteNewUserDto,
    manager?: EntityManager
  ): Promise<OrganizationUser> {
    const userParams = <User>{
      firstName: inviteNewUserDto.first_name,
      lastName: inviteNewUserDto.last_name,
      email: inviteNewUserDto.email,
      ...getUserStatusAndSource(lifecycleEvents.USER_INVITE),
    };
    const groups = inviteNewUserDto.groups ?? [];

    return await dbTransactionWrap(async (manager: EntityManager) => {
      let user = await this.usersService.findByEmail(userParams.email, undefined, undefined, manager);

      if (user?.status === USER_STATUS.ARCHIVED) {
        throw new BadRequestException(getUserErrorMessages(user.status));
      }
      let defaultOrganization: Organization,
        shouldSendWelcomeMail = false;

      if (user?.organizationUsers?.some((ou) => ou.organizationId === currentUser.organizationId)) {
        throw new BadRequestException('Duplicate email found. Please provide a unique email address.');
      }

      if (user?.invitationToken) {
        // user sign up not completed, name will be empty - updating name and source
        await this.usersService.update(
          user.id,
          { firstName: userParams.firstName, lastName: userParams.lastName, source: userParams.source },
          manager
        );
      }

      if (!user) {
        // User not exist
        shouldSendWelcomeMail = true;
        // Create default organization if user not exist
        const organizationName = generateNextName('My workspace');
        defaultOrganization = await this.create(organizationName, null, manager);
      } else if (user.invitationToken) {
        // User not setup
        shouldSendWelcomeMail = true;
      }
      user = await this.usersService.create(
        userParams,
        currentUser.organizationId,
        ['all_users', ...groups],
        user,
        true,
        defaultOrganization?.id,
        manager
      );

      if (defaultOrganization) {
        // Setting up default organization
        await this.organizationUserService.create(user, defaultOrganization, true, manager);
        await this.usersService.attachUserGroup(['all_users', 'admin'], defaultOrganization.id, user.id, manager);
      }

      const currentOrganization: Organization = await this.organizationsRepository.findOneOrFail({
        where: { id: currentUser.organizationId },
      });

      const organizationUser: OrganizationUser = await this.organizationUserService.create(
        user,
        currentOrganization,
        true,
        manager
      );

      if (shouldSendWelcomeMail) {
        this.emailService
          .sendWelcomeEmail(
            user.email,
            user.firstName,
            user.invitationToken,
            `${organizationUser.invitationToken}?oid=${organizationUser.organizationId}`,
            currentOrganization.name,
            `${currentUser.firstName} ${currentUser.lastName ?? ''}`
          )
          .catch((err) => console.error('Error while sending welcome mail', err));
      } else {
        this.emailService
          .sendOrganizationUserWelcomeEmail(
            user.email,
            user.firstName,
            `${currentUser.firstName} ${currentUser.lastName ?? ''}`,
            `${organizationUser.invitationToken}?oid=${organizationUser.organizationId}`,
            currentOrganization.name
          )
          .catch((err) => console.error('Error while sending welcome mail', err));
      }
      return organizationUser;
    }, manager);
  }

  decamelizeDefaultGroupNames(groups: string) {
    return groups?.length
      ? groups
          .split('|')
          .map((group: string) =>
            group === 'All Users' || group === 'Admin' ? decamelize(group.replace(' ', '')) : group
          )
      : [];
  }

  async inviteUserswrapper(users, currentUser: User): Promise<void> {
    await dbTransactionWrap(async (manager) => {
      for (let i = 0; i < users.length; i++) {
        await this.inviteNewUser(currentUser, users[i], manager);
      }
    });
  }

  async bulkUploadUsers(currentUser: User, fileStream, res: Response) {
    const users = [];
    const existingUsers = [];
    const archivedUsers = [];
    const invalidRows = [];
    const invalidFields = new Set();
    const invalidGroups = [];
    let isUserInOtherGroupsAndAdmin = false;
    const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    const manager = getManager();

    const groupPermissions = await this.groupPermissionService.findAll(currentUser);
    const existingGroups = groupPermissions.map((groupPermission) => groupPermission.group);

    csv
      .parseString(fileStream.toString(), {
        headers: ['first_name', 'last_name', 'email', 'groups'],
        renameHeaders: true,
        ignoreEmpty: true,
      })
      .transform((row: UserCsvRow, next) => {
        return next(null, {
          ...row,
          groups: this.decamelizeDefaultGroupNames(row?.groups),
        });
      })
      .validate(async (data: UserCsvRow, next) => {
        await dbTransactionWrap(async (manager: EntityManager) => {
          //Check for existing users
          const user = await this.usersService.findByEmail(data?.email, undefined, undefined, manager);

          if (user?.status === USER_STATUS.ARCHIVED) {
            archivedUsers.push(data?.email);
          } else if (user?.organizationUsers?.some((ou) => ou.organizationId === currentUser.organizationId)) {
            existingUsers.push(data?.email);
          } else {
            users.push(data);
          }

          //Check for invalid groups
          const receivedGroups: string[] | null = data?.groups.length ? data?.groups : null;

          if (Array.isArray(receivedGroups)) {
            for (const group of receivedGroups) {
              if (group === 'admin' && receivedGroups.includes('all_users') && receivedGroups.length > 2) {
                isUserInOtherGroupsAndAdmin = true;
                break;
              }

              if (existingGroups.indexOf(group) === -1) {
                invalidGroups.push(group);
              }
            }
          }

          data.first_name = data.first_name?.trim();
          data.last_name = data.last_name?.trim();

          const isValidName = data.first_name !== '' || data.last_name !== '';

          return next(null, isValidName && emailPattern.test(data.email) && receivedGroups?.length > 0);
        }, manager);
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
            const errorMsg = `Invalid row(s): [${invalidFieldsArray.join(', ')}] in [${
              invalidRows.length
            }] row(s). No users were uploaded.`;
            throw new BadRequestException(errorMsg);
          }

          if (isUserInOtherGroupsAndAdmin) {
            throw new BadRequestException(
              'Conflicting Group Memberships: User cannot be in both the Admin group and other groups simultaneously.'
            );
          }

          if (invalidGroups.length) {
            throw new BadRequestException(
              `${invalidGroups.length} group${isPlural(invalidGroups)} doesn't exist. No users were uploaded`
            );
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

          await this.inviteUserswrapper(users, currentUser);
          res.status(201).send({ message: `${rowCount} user${isPlural(users)} are being added` });
        } catch (error) {
          const { status, response } = error;
          res.status(status).send(response);
        }
      })
      .on('error', (error) => {
        throw error.message;
      });
  }
}
