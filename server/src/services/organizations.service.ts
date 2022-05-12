import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupPermission } from 'src/entities/group_permission.entity';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { User } from 'src/entities/user.entity';
import { cleanObject } from 'src/helpers/utils.helper';
import { createQueryBuilder, Repository } from 'typeorm';
import { OrganizationUser } from '../entities/organization_user.entity';
import { EncryptionService } from './encryption.service';
import { GroupPermissionsService } from './group_permissions.service';
import { OrganizationUsersService } from './organization_users.service';
import { UsersService } from './users.service';

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
    private encryptionService: EncryptionService
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
      });
      await this.groupPermissionsRepository.save(groupPermission);
      createdGroupPermissions.push(groupPermission);
    }

    return createdGroupPermissions;
  }

  async fetchUsers(user: any): Promise<OrganizationUser[]> {
    const organizationUsers = await this.organizationUsersRepository.find({
      where: { organizationId: user.organizationId },
      relations: ['user'],
    });

    const isAdmin = await this.usersService.hasGroup(user, 'admin');

    // serialize
    const serializedUsers = [];
    for (const orgUser of organizationUsers) {
      const serializedUser = {
        email: orgUser.user.email,
        firstName: orgUser.user.firstName,
        lastName: orgUser.user.lastName,
        name: `${orgUser.user.firstName} ${orgUser.user.lastName}`,
        id: orgUser.id,
        role: orgUser.role,
        status: orgUser.status,
      };

      if (isAdmin && orgUser.invitationToken) {
        serializedUser['invitationToken'] = orgUser.invitationToken;
      }
      serializedUsers.push(serializedUser);
    }

    return serializedUsers;
  }

  async fetchOrganisations(user: any): Promise<Organization[]> {
    return await createQueryBuilder(Organization, 'organization')
      .innerJoin(
        'organization.organizationUsers',
        'organisation_users',
        'organisation_users.status IN(:...statusList)',
        {
          statusList: ['active'],
        }
      )
      .andWhere('organisation_users.userId = :userId', {
        userId: user.id,
      })
      .orderBy('name', 'ASC')
      .getMany();
  }

  async findOrganizationSupportsFormLogin(user: any): Promise<Organization[]> {
    return await createQueryBuilder(Organization, 'organization')
      .innerJoin('organization.ssoConfigs', 'organisation_sso', 'organisation_sso.sso = :form', {
        form: 'form',
      })
      .innerJoin(
        'organization.organizationUsers',
        'organisation_users',
        'organisation_users.status IN(:...statusList)',
        {
          statusList: ['active'],
        }
      )
      .where('organisation_sso.enabled = :enabled', {
        enabled: true,
      })
      .andWhere('organisation_users.userId = :userId', {
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

  async fetchOrganisationDetails(
    organizationId: string,
    statusList?: Array<boolean>,
    isHideSensitiveData?: boolean
  ): Promise<Organization> {
    const result = await createQueryBuilder(Organization, 'organization')
      .innerJoinAndSelect(
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

    if (!(result?.ssoConfigs?.length > 0)) {
      return;
    }

    for (const sso of result?.ssoConfigs) {
      await this.decryptSecret(sso?.configs);
    }

    if (!isHideSensitiveData) {
      return result;
    }
    return this.hideSSOSensitiveData(result?.ssoConfigs, result?.name);
  }

  private hideSSOSensitiveData(ssoConfigs: SSOConfigs[], organizationName): any {
    const configs = { name: organizationName };
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
    const { name, domain, enableSignUp } = params;

    const updateableParams = {
      name,
      domain,
      enableSignUp,
    };

    // removing keys with undefined values
    cleanObject(updateableParams);

    return await this.organizationsRepository.update(organizationId, updateableParams);
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

      const updateableParams = {
        configs,
        enabled,
      };

      // removing keys with undefined values
      cleanObject(updateableParams);
      return await this.ssoConfigRepository.update(ssoConfigs.id, updateableParams);
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
}
