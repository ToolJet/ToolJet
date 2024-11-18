import { BadRequestException, ConflictException, Injectable, NotAcceptableException } from '@nestjs/common';
import * as csv from 'fast-csv';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { User } from 'src/entities/user.entity';
import { catchDbException, cleanObject, isPlural, fullName, generateNextNameAndSlug } from 'src/helpers/utils.helper';
import { Brackets, DeepPartial, EntityManager, Repository, DataSource as TypeORMDatasource } from 'typeorm';
import { OrganizationUser } from '../entities/organization_user.entity';
import { EmailService } from './email.service';
import { EncryptionService } from './encryption.service';
import { OrganizationUsersService } from './organization_users.service';
import { DataSourcesService } from './data_sources.service';
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
import { Response } from 'express';
import { AppEnvironmentService } from './app_environments.service';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { OrganizationUpdateDto } from '@dto/organization.dto';
import { UserRoleService } from './user-role.service';
import {
  GROUP_PERMISSIONS_TYPE,
  USER_ROLE,
} from '@modules/user_resource_permissions/constants/group-permissions.constant';
import { DataSourceScopes, DataSourceTypes } from 'src/helpers/data_source.constants';
import { DataSource } from 'src/entities/data_source.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { ERROR_HANDLER, ERROR_HANDLER_TITLE } from '@modules/organizations/constant/constants';
import { GroupPermissionsServiceV2 } from './group_permissions.service.v2';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { TooljetDbService } from './tooljet_db.service';

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
  user_role: string;
  groups?: any;
}

const orgConstraints = [
  {
    dbConstraint: DataBaseConstraints.WORKSPACE_NAME_UNIQUE,
    message: 'This workspace name is already taken.',
  },
  {
    dbConstraint: DataBaseConstraints.WORKSPACE_SLUG_UNIQUE,
    message: 'This workspace slug is already taken.',
  },
];

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(SSOConfigs)
    private ssoConfigRepository: Repository<SSOConfigs>,
    private usersService: UsersService,
    private dataSourceService: DataSourcesService,
    private organizationUserService: OrganizationUsersService,
    private groupPermissionService: GroupPermissionsServiceV2,
    private appEnvironmentService: AppEnvironmentService,
    private encryptionService: EncryptionService,
    private emailService: EmailService,
    private configService: ConfigService,
    private userRoleService: UserRoleService,
    private tooljetdbService: TooljetDbService,
    private readonly _dataSource: TypeORMDatasource
  ) {}

  async create(name: string, slug: string, user: User, manager?: EntityManager): Promise<Organization> {
    let organization: Organization;
    await dbTransactionWrap(async (manager: EntityManager) => {
      organization = await catchDbException(async () => {
        return await manager.save(
          manager.create(Organization, {
            ssoConfigs: [
              {
                sso: 'form',
                enabled: true,
              },
            ],
            name,
            slug,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
      }, orgConstraints);

      await this.appEnvironmentService.createDefaultEnvironments(organization.id, manager);

      await this.userRoleService.createDefaultGroups(organization.id, manager);

      if (user) {
        await this.organizationUserService.create(user, organization, false, manager);
        await this.userRoleService.addUserRole({ role: USER_ROLE.ADMIN, userId: user.id }, organization.id, manager);
      }
      await this.tooljetdbService.createTooljetDbTenantSchemaAndRole(organization.id, manager);
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
      enableSignUp: this.configService.get<string>('DISABLE_SIGNUPS') !== 'true',
    };
  }

  async get(id: string): Promise<Organization> {
    return await this.organizationsRepository.findOne({ where: { id }, relations: ['ssoConfigs'] });
  }

  async fetchOrganization(slug: string, manager?: EntityManager): Promise<Organization> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      let organization: Organization;
      try {
        organization = await manager.findOneOrFail(Organization, {
          where: { slug },
          select: ['id', 'slug', 'name'],
        });
      } catch (error) {
        organization = await manager.findOneOrFail(Organization, {
          where: { id: slug },
          select: ['id', 'slug', 'name'],
        });
      }
      return organization;
    }, manager);
  }

  async getSingleOrganization(): Promise<Organization> {
    const responses = await this.organizationsRepository.find({ take: 1, relations: ['ssoConfigs'] });
    return responses[0];
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
    const query = this._dataSource
      .createQueryBuilder(OrganizationUser, 'organization_user')
      .innerJoinAndSelect('organization_user.user', 'user')
      .innerJoinAndSelect(
        'user.userPermissions',
        'userPermissions',
        'userPermissions.organizationId = :organizationId',
        {
          organizationId: organizationId,
        }
      )
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
      //Change as per new group permissions
      const role = orgUser.user.userPermissions.filter((group) => group.type === GROUP_PERMISSIONS_TYPE.DEFAULT);
      const groups = orgUser.user.userPermissions.filter((group) => group.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP);
      return {
        email: orgUser.user.email,
        firstName: orgUser.user.firstName ?? '',
        lastName: orgUser.user.lastName ?? '',
        name: fullName(orgUser.user.firstName, orgUser.user.lastName),
        id: orgUser.id,
        userId: orgUser.user.id,
        role: orgUser.role,
        status: orgUser.status,
        avatarId: orgUser.user.avatarId,
        groups: groups.map((groupPermission) => ({ name: groupPermission.name, id: groupPermission.id })),
        roleGroup: role.map((groupPermission) => ({ name: groupPermission.name, id: groupPermission.id })),
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
    return await this._dataSource
      .createQueryBuilder(Organization, 'organization')
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

    const query = this._dataSource
      .createQueryBuilder(Organization, 'organization')
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
    return await this._dataSource
      .createQueryBuilder(Organization, 'organization')
      .leftJoinAndSelect('organization.ssoConfigs', 'organisation_sso', 'organisation_sso.sso = :sso', {
        sso,
      })
      .andWhere('organization.id = :organizationId', {
        organizationId,
      })
      .getOne();
  }

  constructOrgFindQuery(slug: string, id: string, statusList?: Array<boolean>) {
    const query = this._dataSource
      .createQueryBuilder(Organization, 'organization')
      .leftJoinAndSelect(
        'organization.ssoConfigs',
        'organisation_sso',
        'organisation_sso.enabled IN (:...statusList)',
        {
          statusList: statusList || [true, false], // Return enabled and disabled sso if status list not passed
        }
      );
    if (slug) {
      query.andWhere(`organization.slug = :slug`, { slug });
    } else {
      query.andWhere(`organization.id = :id`, { id });
    }
    return query;
  }

  async fetchOrganizationDetails(
    organizationId: string,
    statusList?: Array<boolean>,
    isHideSensitiveData?: boolean,
    addInstanceLevelSSO?: boolean
  ): Promise<DeepPartial<Organization>> {
    let result: DeepPartial<Organization>;
    try {
      result = await this.constructOrgFindQuery(organizationId, null, statusList).getOneOrFail();
    } catch (error) {
      result = await this.constructOrgFindQuery(null, organizationId, statusList).getOne();
    }

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
        } as SSOConfigs); //TODO: Need a result type for this
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
        } as SSOConfigs);
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
    return this.hideSSOSensitiveData(result?.ssoConfigs, result?.name, result?.enableSignUp, result.id);
  }

  private hideSSOSensitiveData(
    ssoConfigs: DeepPartial<SSOConfigs>[],
    organizationName: string,
    enableSignUp: boolean,
    organizationId: string
  ): any {
    const configs = { name: organizationName, enableSignUp, id: organizationId };
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

  async updateOrganization(organizationId: string, params: OrganizationUpdateDto) {
    const { name, slug, domain, enableSignUp, inheritSSO } = params;

    const updatableParams = {
      name,
      slug,
      domain,
      enableSignUp,
      inheritSSO,
    };

    // removing keys with undefined values
    cleanObject(updatableParams);

    return await catchDbException(async () => {
      return await this.organizationsRepository.update(organizationId, updatableParams);
    }, orgConstraints);
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

    const groups = inviteNewUserDto?.groups;
    const role = inviteNewUserDto.role;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let user = await this.usersService.findByEmail(userParams.email, undefined, undefined, manager);
      if (user?.status === USER_STATUS.ARCHIVED) {
        throw new BadRequestException(getUserErrorMessages(user.status));
      }
      let defaultOrganization: Organization,
        shouldSendWelcomeMail = false;

      if (user?.organizationUsers?.some((ou) => ou.organizationId === currentUser.organizationId)) {
        throw new BadRequestException({
          message: {
            error: ERROR_HANDLER.DUPLICATE_EMAIL_PRESENT,
            title: ERROR_HANDLER_TITLE.DUPLICATE_EMAIL_PRESENT,
          },
        });
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
        const { name, slug } = generateNextNameAndSlug('My workspace');
        defaultOrganization = await this.create(name, slug, null, manager);
      } else if (user.invitationToken) {
        // User not setup
        shouldSendWelcomeMail = true;
      }

      user = await this.usersService.create(
        userParams,
        currentUser.organizationId,
        role,
        user,
        true,
        defaultOrganization?.id,
        manager
      );
      if (defaultOrganization) {
        // Setting up default organization
        await this.organizationUserService.create(user, defaultOrganization, true, manager);
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

      await this.usersService.attachUserGroup(groups, currentOrganization.id, user.id, manager);
      const name = fullName(currentUser.firstName, currentUser.lastName);
      if (shouldSendWelcomeMail) {
        this.emailService
          .sendWelcomeEmail(
            user.email,
            user.firstName,
            user.invitationToken,
            organizationUser.invitationToken,
            organizationUser.organizationId,
            currentOrganization.name,
            name
          )
          .catch((err) => console.error('Error while sending welcome mail', err));
      } else {
        this.emailService
          .sendOrganizationUserWelcomeEmail(
            user.email,
            user.firstName,
            name,
            organizationUser.invitationToken,
            currentOrganization.name,
            organizationUser.organizationId
          )
          .catch((err) => console.error('Error while sending welcome mail', err));
      }
      return organizationUser;
    }, manager);
  }

  createGroupsList(groups: string) {
    return groups?.length ? groups.split('|') : [];
  }

  async inviteUserswrapper(users, currentUser: User): Promise<void> {
    await dbTransactionWrap(async (manager) => {
      for (let i = 0; i < users.length; i++) {
        await this.inviteNewUser(currentUser, users[i], manager);
      }
    });
  }

  convertUserRolesCasing(role: string) {
    switch (role) {
      case 'End User':
        return 'end-user';
      case 'Builder':
        return 'builder';
      case 'Admin':
        return 'admin';
      default:
        break;
    }
  }

  async bulkUploadUsers(currentUser: User, fileStream, res: Response) {
    const users = [];
    const existingUsers = [];
    const archivedUsers = [];
    const invalidRows = [];
    const invalidFields = new Set();
    let invalidGroups = [];
    const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    const manager = this._dataSource.manager;
    const invalidRoles = [];
    const groupPermissions = (await this.groupPermissionService.getAllGroup(currentUser.organizationId))
      .groupPermissions;
    const existingGroups = groupPermissions.map((groupPermission) => groupPermission.name);
    try {
      csv
        .parseString(fileStream.toString(), {
          headers: ['first_name', 'last_name', 'email', 'user_role', 'groups'],
          renameHeaders: true,
          ignoreEmpty: true,
        })
        .transform((row: UserCsvRow, next) => {
          const groupNames = this.createGroupsList(row?.groups);
          invalidGroups = [...invalidGroups, ...groupNames.filter((group) => !existingGroups.includes(group))];
          const groups = groupPermissions.filter((group) => groupNames.includes(group.name)).map((group) => group.id);
          return next(null, {
            ...row,
            groups: groups,
            user_role: this.convertUserRolesCasing(row?.user_role),
          });
        })
        .validate(async (data: UserCsvRow, next) => {
          await dbTransactionWrap(async (manager: EntityManager) => {
            //Check for existing users
            let isInvalidRole = false;

            const user = await this.usersService.findByEmail(data?.email, undefined, undefined, manager);

            if (user?.status === USER_STATUS.ARCHIVED) {
              archivedUsers.push(data?.email);
            } else if (user?.organizationUsers?.some((ou) => ou.organizationId === currentUser.organizationId)) {
              existingUsers.push(data?.email);
            } else {
              const user = {
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                role: data.user_role,
                groups: data?.groups,
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
    } catch (error) {
      console.error('Error happened while reading CSV file');
      throw new BadRequestException('Issue with CSV file format');
    }
  }

  async checkWorkspaceUniqueness(name: string, slug: string) {
    if (!(slug || name)) {
      throw new NotAcceptableException('Request should contain the slug or name');
    }
    const result = await this.organizationsRepository.findOne({
      where: {
        ...(name && { name }),
        ...(slug && { slug }),
      },
    });
    if (result) throw new ConflictException(`Workspace ${name ? 'name' : 'slug'} already exists`);
    return;
  }

  async checkWorkspaceNameUniqueness(name: string) {
    if (!name) {
      throw new NotAcceptableException('Request should contain workspace name');
    }
    const manager = this._dataSource.manager;
    const result = await manager.count(Organization, {
      where: {
        ...(name && { name }),
      },
    });
    if (result) throw new ConflictException('Workspace name must be unique');
    return;
  }

  async createSampleDB(organizationId, manager: EntityManager) {
    const config = {
      name: 'Sample Data Source',
      kind: 'postgresql',
      type: DataSourceTypes.SAMPLE,
      scope: DataSourceScopes.GLOBAL,
      organizationId,
    };
    const options = [
      {
        key: 'host',
        value: this.configService.get<string>('PG_HOST'),
        encrypted: true,
      },
      {
        key: 'port',
        value: this.configService.get<string>('PG_PORT'),
        encrypted: true,
      },
      {
        key: 'database',
        value: 'sample_db',
      },
      {
        key: 'username',
        value: this.configService.get<string>('PG_USER'),
        encrypted: true,
      },
      {
        key: 'password',
        value: this.configService.get<string>('PG_PASS'),
        encrypted: true,
      },
      {
        key: 'ssl_enabled',
        value: false,
        encrypted: true,
      },
      { key: 'ssl_certificate', value: 'none', encrypted: false },
    ];
    const dataSource = manager.create(DataSource, config);
    await manager.save(dataSource);

    const allEnvs: AppEnvironment[] = await this.appEnvironmentService.getAll(organizationId, manager);

    await Promise.all(
      allEnvs?.map(async (env) => {
        const parsedOptions = await this.dataSourceService.parseOptionsForCreate(options);
        await manager.save(
          manager.create(DataSourceOptions, {
            environmentId: env.id,
            dataSourceId: dataSource.id,
            options: parsedOptions,
          })
        );
      })
    );
  }
}
