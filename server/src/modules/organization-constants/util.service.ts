import { EncryptionService } from '@modules/encryption/service';
import { IOrganizationConstantsUtilService } from './interfaces/IUtilService';
import { OrganizationConstantRepository } from './repository';
import { EntityManager, DeleteResult } from 'typeorm';
import { OrgEnvironmentConstantValue } from 'src/entities/org_environment_constant_values.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { dbTransactionWrap } from '@helpers/database.helper';
import { Injectable } from '@nestjs/common';

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
    manager?: EntityManager
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        OrgEnvironmentConstantValue,
        { environmentId, organizationConstantId: orgConstantId },
        { value: constantValue, updatedAt: new Date() }
      );
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
      return manager.findOneOrFail(OrgEnvironmentConstantValue, {
        where: { organizationConstantId: constant.id, environmentId },
      });
    }, manager);
  }

  async deleteOrgEnvironmentConstant(
    constantId: string,
    organizationId: string,
    environmentId: string
  ): Promise<DeleteResult> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const constantToDelete = await this.organizationConstantRepository.findOneByIdAndOrganizationId(
        constantId,
        organizationId
      );
      if (!constantToDelete) {
        throw new Error('Constant not found');
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

  escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
