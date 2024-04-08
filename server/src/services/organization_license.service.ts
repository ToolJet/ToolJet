import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { LICENSE_TYPE, decrypt } from 'src/helpers/license.helper';
import { LicenseUpdateDto } from '@dto/license.dto';
import { OrganizationsLicense } from 'src/entities/organization_license.entity';
import { CreateCloudTrialLicenseDto } from '@dto/create-cloud-trial-license.dto';
import { Brackets, EntityManager } from 'typeorm';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { ConfigService } from '@nestjs/config';
import { AuditLoggerService } from './audit_logger.service';
import { ResourceTypes, ActionTypes } from 'src/entities/audit_log.entity';
import { USER_STATUS, USER_TYPE } from 'src/helpers/user_lifecycle';
import { User } from 'src/entities/user.entity';
import { Terms } from '@ee/licensing/types';

@Injectable()
export class OrganizationLicenseService {
  constructor(private configService: ConfigService, private auditLoggerService: AuditLoggerService) {}

  async getLicense(organizationId: string): Promise<OrganizationsLicense> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(OrganizationsLicense, {
        where: { organizationId: organizationId },
      });
    });
  }

  async updateLicense(dto: LicenseUpdateDto, organizationId: string): Promise<void> {
    try {
      const licenseTerms = decrypt(dto.key);
      if (!licenseTerms?.expiry) {
        throw new Error('Invalid License Key:expiry not found');
      }

      const isLicenseValidForOrganization = organizationId === licenseTerms?.workspaceId;
      if (!isLicenseValidForOrganization) {
        throw new Error('Incorrect organization in license key');
      }
      const expiryWithTime = new Date(`${licenseTerms?.expiry} 23:59:59Z`);
      const expiryWithGracePeriod = expiryWithTime.setDate(
        expiryWithTime.getDate() + licenseTerms.type !== LICENSE_TYPE.TRIAL ? 14 : 0
      );

      await dbTransactionWrap((manager: EntityManager) => {
        return manager.update(
          OrganizationsLicense,
          { organizationId: licenseTerms?.workspaceId || organizationId },
          {
            licenseKey: dto.key,
            terms: licenseTerms,
            expiryDate: expiryWithTime,
            expiryWithGracePeriod,
            licenseType: licenseTerms.type,
          }
        );
      });
    } catch (err) {
      throw new BadRequestException(err?.message || 'License key is invalid');
    }
  }

  async generateCloudTrialLicense(createDto: CreateCloudTrialLicenseDto, manager?: EntityManager) {
    const { email, companyName, organizationId, customerId } = createDto;
    try {
      await dbTransactionWrap(async (manager: EntityManager) => {
        const organizationLicense = await manager
          .createQueryBuilder(OrganizationsLicense, 'org_license')
          .innerJoin('org_license.organization', 'organization', 'org_license.organization_id = :organizationId', {
            organizationId,
          })
          .getOne();

        if (organizationLicense) {
          throw new ConflictException('Trial license already exists for this organization');
        }

        const { editor, viewer } = await this.fetchTotalViewerEditorCount(manager, organizationId);

        const editorCount = (editor || 5) > 5 ? editor : 5;
        const viewerCount = (viewer || 10) > 10 ? viewer : 10;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 14);
        const terms: Terms = {
          expiry: expiryDate.toISOString().split('T')[0],
          type: LICENSE_TYPE.TRIAL,
          workspaceId: organizationId,
          users: {
            total: editorCount + viewerCount,
            editor: editorCount,
            viewer: viewerCount,
            superadmin: 1,
          },
          database: {
            table: '',
          },
          features: {
            oidc: true,
            auditLogs: true,
            ldap: true,
            customStyling: true,
          },
          meta: {
            generatedFrom: 'API',
            customerName: companyName || email,
            customerId,
          },
        };
        const expiryWithTime = new Date(`${expiryDate.toISOString().split('T')[0]} 23:59:59Z`);
        await manager.upsert(
          OrganizationsLicense,
          {
            terms,
            expiryDate: expiryWithTime,
            expiryWithGracePeriod: expiryWithTime,
            licenseType: LICENSE_TYPE.TRIAL,
            organizationId: organizationId,
            updatedAt: new Date(),
          },
          ['organizationId']
        );

        await this.auditLoggerService.perform(
          {
            userId: customerId,
            organizationId: organizationId,
            resourceId: customerId,
            resourceType: ResourceTypes.USER,
            resourceName: email,
            actionType: ActionTypes.TRIAL_GENERATION_FOR_WORKSPACE,
          },
          manager
        );
      }, manager);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async fetchTotalViewerEditorCount(
    manager: EntityManager,
    organizationId?: string
  ): Promise<{ editor: number; viewer: number }> {
    const userIdsWithEditPermissions = await this.getUserIdWithEditPermission(manager, organizationId);
    const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];
    const organizationUsersCondition = this.createOrganizationUsersJoinCondition(organizationId);

    if (!userIdsWithEditPermissions?.length) {
      // No editors -> No viewers
      return { editor: 0, viewer: 0 };
    }
    const viewer = await manager
      .createQueryBuilder(User, 'users')
      .innerJoin('users.organizationUsers', 'organization_users', organizationUsersCondition, {
        statusList,
        organizationId,
      })
      .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
      .andWhere('users.id NOT IN(:...userIdsWithEditPermissions)', { userIdsWithEditPermissions })
      .select('users.id')
      .distinct()
      .getCount();

    return { editor: userIdsWithEditPermissions?.length || 0, viewer };
  }

  async fetchTotalEditorCount(manager: EntityManager, organizationId?: string): Promise<number> {
    const userIdsWithEditPermissions = await this.getUserIdWithEditPermission(manager, organizationId);
    return userIdsWithEditPermissions?.length || 0;
  }

  private createAppsJoinCondition(organizationId?: string): string {
    return organizationId ? 'apps.organizationId = :organizationId' : '1=1';
  }

  private createGroupPermissionsJoinCondition(organizationId?: string): string {
    return organizationId ? 'group_permissions.organizationId = :organizationId' : '1=1';
  }

  createOrganizationUsersJoinCondition(organizationId?: string): string {
    const statusCondition = 'organization_users.status IN (:...statusList)';
    const organizationCondition = organizationId ? ' AND organization_users.organizationId = :organizationId' : '';
    return `${statusCondition}${organizationCondition}`;
  }

  private async getUserIdWithEditPermission(manager: EntityManager, organizationId?: string) {
    const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];
    const groupPermissionsCondition = this.createGroupPermissionsJoinCondition(organizationId);
    const organizationUsersCondition = this.createOrganizationUsersJoinCondition(organizationId);
    const appsCondition = this.createAppsJoinCondition(organizationId);
    const userIdsWithEditPermissions = (
      await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.groupPermissions', 'group_permissions', groupPermissionsCondition, { organizationId })
        .leftJoin('group_permissions.appGroupPermission', 'app_group_permissions')
        .innerJoin('users.organizationUsers', 'organization_users', organizationUsersCondition, {
          statusList,
          organizationId,
        })
        .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
        .andWhere(
          new Brackets((qb) => {
            qb.where('app_group_permissions.read = true AND app_group_permissions.update = true').orWhere(
              'group_permissions.appCreate = true'
            );
          })
        )
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    const userIdsOfAppOwners = (
      await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.apps', 'apps', appsCondition, { organizationId })
        .innerJoin('users.organizationUsers', 'organization_users', organizationUsersCondition, {
          statusList,
          organizationId,
        })
        .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    const userIdsOfSuperAdmins = (
      await manager
        .createQueryBuilder(User, 'users')
        .select('users.id')
        .where('users.userType = :userType', { userType: USER_TYPE.INSTANCE })
        .andWhere('users.status = :status', { status: USER_STATUS.ACTIVE })
        .getMany()
    ).map((record) => record.id);

    return [...new Set([...userIdsWithEditPermissions, ...userIdsOfAppOwners, ...userIdsOfSuperAdmins])];
  }
}
