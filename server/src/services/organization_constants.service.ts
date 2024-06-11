import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationConstant } from '../entities/organization_constants.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EncryptionService } from './encryption.service';
import { AppEnvironmentService } from './app_environments.service';

import { DeleteResult, EntityManager, Repository } from 'typeorm';
import { CreateOrganizationConstantDto, UpdateOrganizationConstantDto } from '@dto/organization-constant.dto';

@Injectable()
export class OrganizationConstantsService {
  constructor(
    @InjectRepository(OrganizationConstant)
    private organizationConstantsRepository: Repository<OrganizationConstant>,
    private encryptionService: EncryptionService,
    private appEnvironmentService: AppEnvironmentService
  ) {}

  async allEnvironmentConstants(organizationId: string): Promise<OrganizationConstant[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const query = manager
        .createQueryBuilder(OrganizationConstant, 'organization_constants')
        .leftJoinAndSelect('organization_constants.orgEnvironmentConstantValues', 'org_environment_constant_values')
        .where('organization_constants.organization_id = :organizationId', { organizationId });
      const result = await query.getMany();

      const appEnvironments = await this.appEnvironmentService.getAll(organizationId, manager);

      const constantsWithValues = await Promise.all(
        result.map(async (constant) => {
          const values = await Promise.all(
            appEnvironments.map(async (env) => {
              const value = constant.orgEnvironmentConstantValues.find((value) => value.environmentId === env.id);

              return {
                environmentName: env.name,
                value: value && value.value.length > 0 ? await this.decryptSecret(organizationId, value.value) : '',
                id: value.environmentId,
              };
            })
          );

          return {
            id: constant.id,
            name: constant.constantName,
            values,
            createdAt: constant.createdAt,
          };
        })
      );

      return constantsWithValues;
    });
  }

  async getConstantsForEnvironment(organizationId: string, environmentId: string): Promise<OrganizationConstant[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const query = manager
        .createQueryBuilder(OrganizationConstant, 'organization_constants')
        .leftJoinAndSelect('organization_constants.orgEnvironmentConstantValues', 'org_environment_constant_values')
        .where('organization_constants.organization_id = :organizationId', { organizationId })
        .andWhere('org_environment_constant_values.environment_id = :environmentId', { environmentId });
      const result = await query.getMany();

      const constantsWithValues = result.map(async (constant) => {
        const decryptedValue = await this.decryptSecret(organizationId, constant.orgEnvironmentConstantValues[0].value);
        return {
          id: constant.id,
          name: constant.constantName,
          value: decryptedValue,
        };
      });

      return Promise.all(constantsWithValues);
    });
  }

  async create(
    organizationConstant: CreateOrganizationConstantDto,
    organizationId: string
  ): Promise<OrganizationConstant | []> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const newOrganizationConstant = manager.create(OrganizationConstant, {
        constantName: organizationConstant.constant_name,
        organizationId,
      });

      const savedOrganizationConstant = await manager.save(newOrganizationConstant);

      // Creating empty options mapping for the constant
      await this.appEnvironmentService.createOrgConstantsInAllEnvironments(
        organizationId,
        savedOrganizationConstant.id,
        manager
      );

      const environmentsIds = organizationConstant.environments;

      const environmentToUpdate = environmentsIds.map(async (environmentId) => {
        return await this.appEnvironmentService.get(organizationId, environmentId, false, manager);
      });

      await Promise.all(
        environmentToUpdate.map(async (environment) => {
          const encryptedValue = await this.encryptSecret(organizationId, organizationConstant.value);
          await this.appEnvironmentService.updateOrgEnvironmentConstant(
            encryptedValue,
            (
              await environment
            ).id,
            savedOrganizationConstant.id,
            manager
          );
        })
      );

      return savedOrganizationConstant;
    });
  }

  async update(
    constantId: string,
    organizationId: string,
    params: UpdateOrganizationConstantDto
  ): Promise<OrganizationConstant> {
    const { constant_name, environment_id, value } = params;

    if (!constant_name && !value) {
      throw new Error('Nothing to update');
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const constantToUpdate = await manager.findOne(OrganizationConstant, {
        where: { id: constantId, organizationId },
      });

      if (!constantToUpdate) {
        throw new Error('Constant not found');
      }

      if (constant_name) {
        constantToUpdate.constantName = constant_name;
      }

      await manager.save(constantToUpdate);

      const environmentToUpdate = await this.appEnvironmentService.get(organizationId, environment_id, false, manager);
      const encryptedValue = await this.encryptSecret(organizationId, value);

      await this.appEnvironmentService.updateOrgEnvironmentConstant(
        encryptedValue,
        environmentToUpdate.id,
        constantToUpdate.id,
        manager
      );

      return constantToUpdate;
    });
  }

  async delete(constantId: string, organizationId: string, environmentId?: string): Promise<DeleteResult> {
    return await this.appEnvironmentService.deleteOrgEnvironmentConstant(constantId, organizationId, environmentId);
  }

  private async encryptSecret(workspaceId: string, value: string) {
    return await this.encryptionService.encryptColumnValue('org_environment_constant_values', workspaceId, value);
  }

  private async decryptSecret(workspaceId: string, value: string) {
    return await this.encryptionService.decryptColumnValue('org_environment_constant_values', workspaceId, value);
  }
}
