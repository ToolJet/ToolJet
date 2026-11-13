import { EncryptionService } from '@modules/encryption/service';
import { IOrganizationConstantsUtilService } from './interfaces/IUtilService';
import { OrganizationConstantRepository } from './repository';
import { EntityManager, DeleteResult } from 'typeorm';
import { OrgEnvironmentConstantValue } from 'src/entities/org_environment_constant_values.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { dbTransactionWrap } from '@helpers/database.helper';
import { Injectable } from '@nestjs/common';
import { OrganizationConstant } from '@entities/organization_constants.entity';
import { OrganizationConstantType, SECRET_VALUE_MASK } from './constants';
import { ConstantWithEnvironmentValues } from './types';

@Injectable()
export class OrganizationConstantsUtilService implements IOrganizationConstantsUtilService {
  constructor(
    protected readonly encryptionService: EncryptionService,
    protected readonly organizationConstantRepository: OrganizationConstantRepository,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService
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
    }, manager);
  }

  async updateOrgEnvironmentConstant(
    constantValue: string,
    environmentId: string,
    orgConstantId: string,
    userId: string,
    manager?: EntityManager
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        OrgEnvironmentConstantValue,
        { environmentId, organizationConstantId: orgConstantId },
        { value: constantValue, updatedAt: new Date() }
      );
      await this.touchConstant(orgConstantId, userId, manager);
    }, manager);
  }

  // Values live in a child table, so a value write must stamp the parent row to show who changed it and when.
  protected async touchConstant(orgConstantId: string, userId: string, manager: EntityManager): Promise<void> {
    await manager.update(OrganizationConstant, { id: orgConstantId }, { updatedBy: userId });
  }

  // A Global and a Secret can share a name, so the lookup needs the type. Null when the constant does not exist.
  async getOrgEnvironmentConstant(
    constantName: string,
    organizationId: string,
    environmentId: string,
    type: OrganizationConstantType,
    manager?: EntityManager
  ): Promise<OrgEnvironmentConstantValue | null> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const constant = await this.organizationConstantRepository.findOneByNameOrganizationIdAndType(
        constantName,
        organizationId,
        type
      );
      if (!constant) return null;

      return manager.findOneOrFail(OrgEnvironmentConstantValue, {
        where: { organizationConstantId: constant.id, environmentId },
      });
    }, manager);
  }

  async deleteOrgEnvironmentConstant(
    constantId: string,
    organizationId: string,
    userId: string,
    environmentId?: string
  ): Promise<DeleteResult> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
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
        await this.touchConstant(constantId, userId, manager);
        return manager.update(
          OrgEnvironmentConstantValue,
          { id: environmentValueToDelete.id },
          { value: '', updatedAt: new Date() }
        );
      }
    });
  }

  // Returns copies: callers may pass objects owned by the .env constants cache.
  removeSecretValues(constants: ConstantWithEnvironmentValues[]): ConstantWithEnvironmentValues[] {
    return constants.map((constant) =>
      constant.type === OrganizationConstantType.SECRET
        ? { ...constant, values: constant.values.map((value) => ({ ...value, value: SECRET_VALUE_MASK })) }
        : constant
    );
  }
}
