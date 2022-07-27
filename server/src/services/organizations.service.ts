import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { User } from 'src/entities/user.entity';
import { cleanObject } from 'src/helpers/utils.helper';
import { createQueryBuilder, DeepPartial, Repository } from 'typeorm';
import { OrganizationUser } from '../entities/organization_user.entity';
import { EmailService } from './email.service';
import { EncryptionService } from './encryption.service';
import { GroupPermissionsService } from './group_permissions.service';
import { OrganizationUsersService } from './organization_users.service';
import { UsersService } from './users.service';
import { InviteNewUserDto } from '@dto/invite-new-user.dto';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(SSOConfigs)
    private ssoConfigRepository: Repository<SSOConfigs>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    @InjectRepository(GroupPermission)
    private groupPermissionsRepository: Repository<GroupPermission>,
    private usersService: UsersService,
    private organizationUserService: OrganizationUsersService,
    private groupPermissionService: GroupPermissionsService,
    private encryptionService: EncryptionService,
    private emailService: EmailService,
    private configService: ConfigService
  ) {}

  async create(name: string, user?: User): Promise<Organization> {
    const organization = await this.organizationsRepository.save(
      this.organizationsRepository.create({
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

    const createdGroupPermissions = await this.createDefaultGroupPermissionsForOrganization(organization);

    if (user) {
      await this.organizationUserService.create(user, organization, false);

      for (const groupPermission of createdGroupPermissions) {
        await this.groupPermissionService.createUserGroupPermission(user.id, groupPermission.id);
      }
    }

    return organization;
  }

  async get(id: string): Promise<Organization> {
    return await this.organizationsRepository.findOne({ where: { id }, relations: ['ssoConfigs'] });
  }

  async getSingleOrganization(): Promise<Organization> {
    return await this.organizationsRepository.findOne({ relations: ['ssoConfigs'] });
  }

  async createDefaultGroupPermissionsForOrganization(organization: Organization) {
    const defaultGroups = ['all_users', 'admin'];
    const createdGroupPermissions = [];

    for (const group of defaultGroups) {
      const isAdmin = group === 'admin';
      const groupPermission = this.groupPermissionsRepository.create({
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
      await this.groupPermissionsRepository.save(groupPermission);
      createdGroupPermissions.push(groupPermission);
    }

    return createdGroupPermissions;
  }

  async fetchUsers(user: any): Promise<FetchUserResponse[]> {
    const organizationUsers = await this.organizationUsersRepository.find({
      where: { organizationId: user.organizationId },
      relations: ['user'],
    });

    const isAdmin = await this.usersService.hasGroup(user, 'admin');

    return organizationUsers?.map((orgUser) => {
      return {
        email: orgUser.user.email,
        firstName: orgUser.user.firstName,
        lastName: orgUser.user.lastName,
        name: `${orgUser.user.firstName} ${orgUser.user.lastName}`,
        id: orgUser.id,
        userId: orgUser.user.id,
        role: orgUser.role,
        status: orgUser.status,
        ...(isAdmin && orgUser.invitationToken ? { invitationToken: orgUser.invitationToken } : {}),
        ...(this.configService.get<string>('DISABLE_MULTI_WORKSPACE') !== 'true' &&
        this.configService.get<string>('HIDE_ACCOUNT_SETUP_LINK') !== 'true' &&
        orgUser.user.invitationToken
          ? { accountSetupToken: orgUser.user.invitationToken }
          : {}),
      };
    });
  }

  async fetchOrganizations(user: any): Promise<Organization[]> {
    return await createQueryBuilder(Organization, 'organization')
      .innerJoin(
        'organization.organizationUsers',
        'organization_users',
        'organization_users.status IN(:...statusList)',
        {
          statusList: ['active'],
        }
      )
      .andWhere('organization_users.userId = :userId', {
        userId: user.id,
      })
      .orderBy('name', 'ASC')
      .getMany();
  }

  async findOrganizationWithLoginSupport(user: User, loginType: string): Promise<Organization[]> {
    const query = createQueryBuilder(Organization, 'organization')
      .innerJoin('organization.ssoConfigs', 'organization_sso', 'organization_sso.sso = :form', {
        form: 'form',
      })
      .innerJoin(
        'organization.organizationUsers',
        'organization_users',
        'organization_users.status IN(:...statusList)',
        {
          statusList: ['active'],
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

    if (
      addInstanceLevelSSO &&
      this.configService.get<string>('DISABLE_MULTI_WORKSPACE') !== 'true' &&
      result.inheritSSO
    ) {
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

    return await this.organizationsRepository.update(organizationId, updatableParams);
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

  async inviteNewUser(currentUser: User, inviteNewUserDto: InviteNewUserDto): Promise<OrganizationUser> {
    const userParams = <User>{
      firstName: inviteNewUserDto.first_name,
      lastName: inviteNewUserDto.last_name,
      email: inviteNewUserDto.email,
    };

    let user = await this.usersService.findByEmail(userParams.email);
    let defaultOrganization: Organization,
      shouldSendWelcomeMail = false;

    if (user?.organizationUsers?.some((ou) => ou.organizationId === currentUser.organizationId)) {
      throw new BadRequestException('User with such email already exists.');
    }

    if (user?.invitationToken) {
      // user sign up not completed, name will be empty - updating name
      await this.usersService.update(user.id, { firstName: userParams.firstName, lastName: userParams.lastName });
    }

    if (!user && this.configService.get<string>('DISABLE_MULTI_WORKSPACE') !== 'true') {
      // User not exist
      shouldSendWelcomeMail = true;
      // Create default organization
      defaultOrganization = await this.create('Untitled workspace');
    }
    user = await this.usersService.create(
      userParams,
      currentUser.organizationId,
      ['all_users'],
      user,
      true,
      defaultOrganization?.id
    );

    if (defaultOrganization) {
      // Setting up default organization
      await this.organizationUserService.create(user, defaultOrganization, true);
      await this.usersService.attachUserGroup(['all_users', 'admin'], defaultOrganization.id, user.id);
    }

    const currentOrganization: Organization = (
      await this.organizationUsersRepository.findOne({
        where: { userId: currentUser.id, organizationId: currentUser.organizationId },
        relations: ['organization'],
      })
    )?.organization;

    const organizationUser: OrganizationUser = await this.organizationUserService.create(
      user,
      currentOrganization,
      true
    );

    if (shouldSendWelcomeMail) {
      this.emailService
        .sendWelcomeEmail(
          user.email,
          user.firstName,
          user.invitationToken,
          `${organizationUser.invitationToken}?oid=${organizationUser.organizationId}`,
          currentOrganization.name,
          `${currentUser.firstName} ${currentUser.lastName}`
        )
        .catch((err) => console.error('Error while sending welcome mail', err));
    } else {
      this.emailService
        .sendOrganizationUserWelcomeEmail(
          user.email,
          user.firstName,
          `${currentUser.firstName} ${currentUser.lastName}`,
          organizationUser.invitationToken,
          currentOrganization.name
        )
        .catch((err) => console.error('Error while sending welcome mail', err));
    }
    return organizationUser;
  }
}
