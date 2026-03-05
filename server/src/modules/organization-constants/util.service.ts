import { EncryptionService } from '@modules/encryption/service';
import { IOrganizationConstantsUtilService } from './interfaces/IUtilService';
import { OrganizationConstantRepository } from './repository';
import { EntityManager, DeleteResult } from 'typeorm';
import { OrgEnvironmentConstantValue } from 'src/entities/org_environment_constant_values.entity';
import { OrganizationConstant } from '@entities/organization_constants.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { dbTransactionWrap } from '@helpers/database.helper';
import { Injectable } from '@nestjs/common';
import { BranchContextService } from '@modules/workspace-branches/branch-context.service';
import { OrganizationConstantVersion } from '@entities/organization_constant_version.entity';
import { OrganizationConstantVersionValue } from '@entities/organization_constant_version_values.entity';

@Injectable()
export class OrganizationConstantsUtilService implements IOrganizationConstantsUtilService {
  constructor(
    protected readonly encryptionService: EncryptionService,
    protected readonly organizationConstantRepository: OrganizationConstantRepository,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly branchContextService: BranchContextService
  ) {}

  async encryptSecret(workspaceId: string, value: string) {
    return await this.encryptionService.encryptColumnValue('org_environment_constant_values', workspaceId, value);
  }

  async decryptSecret(workspaceId: string, value: string) {
    if (!value) {
      return value;
    }
    return await this.encryptionService.decryptColumnValue('org_environment_constant_values', workspaceId, value);
  }

  async createOrgConstantsInAllEnvironments(
    organizationId: string,
    orgConstantId: string,
    manager?: EntityManager
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const allEnvs = await this.appEnvironmentUtilService.getAllEnvironments(organizationId, manager);
      await Promise.all(
        allEnvs.map((env) => {
          const constantValue = manager.create(OrgEnvironmentConstantValue, {
            organizationConstantId: orgConstantId,
            environmentId: env.id,
            value: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return manager.save(constantValue);
        })
      );

      // Branch-aware: also create version entries
      const branchId = await this.branchContextService.getActiveBranchId(organizationId);
      if (branchId) {
        await this.createConstantVersionForBranch(orgConstantId, branchId, allEnvs, manager);
      }
    }, manager);
  }

  async updateOrgEnvironmentConstant(
    constantValue: string,
    environmentId: string,
    orgConstantId: string,
    manager?: EntityManager
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        OrgEnvironmentConstantValue,
        { environmentId, organizationConstantId: orgConstantId },
        { value: constantValue, updatedAt: new Date() }
      );

      // Branch-aware: also update version values
      // Use the transaction manager (not the repository) so we can see
      // the just-saved constant within the same uncommitted transaction.
      const constant = await manager.findOne(OrganizationConstant, {
        where: { id: orgConstantId },
        select: ['organizationId'],
      });
      if (constant) {
        const branchId = await this.branchContextService.getActiveBranchId(constant.organizationId);
        if (branchId) {
          const cv = await manager.findOne(OrganizationConstantVersion, {
            where: { organizationConstantId: orgConstantId, branchId, isActive: true },
          });
          if (cv) {
            await manager.update(
              OrganizationConstantVersionValue,
              { constantVersionId: cv.id, environmentId },
              { value: constantValue, updatedAt: new Date() }
            );
          }
        }
      }
    }, manager);
  }

  async getOrgEnvironmentConstant(
    constantName: string,
    organizationId: string,
    environmentId: string,
    type?: string,
    manager?: EntityManager
  ): Promise<OrgEnvironmentConstantValue> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const constant = await this.organizationConstantRepository.findOneByNameAndOrganizationId(
        constantName,
        organizationId
      );

      // Branch-aware: try version tables first
      const branchId = await this.branchContextService.getActiveBranchId(organizationId);
      if (branchId) {
        const cv = await manager.findOne(OrganizationConstantVersion, {
          where: { organizationConstantId: constant.id, branchId, isActive: true },
        });
        if (cv) {
          const versionValue = await manager.findOne(OrganizationConstantVersionValue, {
            where: { constantVersionId: cv.id, environmentId },
          });
          if (versionValue) {
            // Return as OrgEnvironmentConstantValue-compatible shape
            return {
              id: versionValue.id,
              value: versionValue.value,
              environmentId,
              organizationConstantId: constant.id,
              createdAt: versionValue.createdAt,
              updatedAt: versionValue.updatedAt,
            } as any;
          }
        }
      }

      return manager.findOneOrFail(OrgEnvironmentConstantValue, {
        where: { organizationConstantId: constant.id, environmentId },
      });
    }, manager);
  }

  async deleteOrgEnvironmentConstant(
    constantId: string,
    organizationId: string,
    environmentId?: string
  ): Promise<DeleteResult> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Branch-aware: soft-delete via OrganizationConstantVersion.isActive = false
      const branchId = await this.branchContextService.getActiveBranchId(organizationId);
      if (branchId) {
        await manager.update(
          OrganizationConstantVersion,
          { organizationConstantId: constantId, branchId },
          { isActive: false, updatedAt: new Date() }
        );
        return { raw: [], affected: 1 } as DeleteResult;
      }

      const constantToDelete = await this.organizationConstantRepository.findOneByIdAndOrganizationId(
        constantId,
        organizationId
      );
      if (!constantToDelete) {
        throw new Error('Constant not found');
      }

      // If no environmentId is provided, delete the constant from all environments
      if (!environmentId) {
        return this.organizationConstantRepository.deleteOneById(constantId);
      }

      if (constantToDelete.orgEnvironmentConstantValues.length === 1) {
        return this.organizationConstantRepository.deleteOneById(constantId);
      } else {
        const environmentValueToDelete = constantToDelete.orgEnvironmentConstantValues.find(
          (value) => value.environmentId === environmentId
        );
        if (!environmentValueToDelete) {
          throw new Error('Environment value not found');
        }
        return manager.update(
          OrgEnvironmentConstantValue,
          { id: environmentValueToDelete.id },
          { value: '', updatedAt: new Date() }
        );
      }
    });
  }

  removeSecretValues(constants = []) {
    constants.forEach((constant) => {
      if (constant.type === 'Secret') {
        constant.values = constant.values.map((value) => {
          return { ...value, value: '*'.repeat(8) };
        });
      }
    });
  }

  /**
   * Creates an OrganizationConstantVersion + OrganizationConstantVersionValue entries
   * for the given branch, copying values from org_environment_constant_values.
   */
  protected async createConstantVersionForBranch(
    orgConstantId: string,
    branchId: string,
    allEnvs: any[],
    manager: EntityManager
  ): Promise<OrganizationConstantVersion> {
    const cv = manager.create(OrganizationConstantVersion, {
      organizationConstantId: orgConstantId,
      branchId,
      isActive: true,
    });
    const savedCv = await manager.save(OrganizationConstantVersion, cv);

    // Copy values from org_environment_constant_values to version values
    for (const env of allEnvs) {
      const existingValue = await manager.findOne(OrgEnvironmentConstantValue, {
        where: { organizationConstantId: orgConstantId, environmentId: env.id },
      });
      const vv = manager.create(OrganizationConstantVersionValue, {
        constantVersionId: savedCv.id,
        environmentId: env.id,
        value: existingValue?.value || '',
      });
      await manager.save(OrganizationConstantVersionValue, vv);
    }

    return savedCv;
  }
}
