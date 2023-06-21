import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationConstant } from '../entities/organization_constants.entity';
// import { User } from '../entities/user.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EncryptionService } from './encryption.service';
import { AppEnvironmentService } from './app_environments.service';

import { EntityManager, Repository } from 'typeorm';
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

      const appEnvironments = await this.appEnvironmentService.getAll(organizationId, null);

      return result.map((constant) => {
        const environmentName = appEnvironments.find(
          (env) => env.id === constant.orgEnvironmentConstantValues[0].environmentId
        ).name;

        return {
          id: constant.id,
          name: constant.constantName,
          environment: environmentName,
          value: constant.orgEnvironmentConstantValues[0].value,
        };
      });
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

      return result.map((constant) => {
        return {
          id: constant.id,
          name: constant.constantName,
          value: constant.orgEnvironmentConstantValues[0].value,
        };
      });
    });
  }

  async create(
    organizationConstant: CreateOrganizationConstantDto,
    organizationId: string
  ): Promise<OrganizationConstant> {
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

      const environmentToUpdate = await this.appEnvironmentService.get(
        organizationId,
        organizationConstant.environment_id,
        manager
      );

      await this.appEnvironmentService.updateOrgEnvironmentConstant(
        organizationConstant.value,
        environmentToUpdate.id,
        savedOrganizationConstant.id,
        manager
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

      const environmentToUpdate = await this.appEnvironmentService.get(organizationId, environment_id, manager);

      await this.appEnvironmentService.updateOrgEnvironmentConstant(
        value,
        environmentToUpdate.id,
        constantToUpdate.id,
        manager
      );

      return constantToUpdate;
    });
  }

  async delete(constantId: string, organizationId: string): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const constantToDelete = await manager.findOne(OrganizationConstant, {
        where: { id: constantId, organizationId },
      });

      if (!constantToDelete) {
        throw new Error('Constant not found');
      }

      await manager.delete(OrganizationConstant, { id: constantId });

      return { message: 'OK' };
    });
  }

  // private async encryptSecret(workspaceId: string, value: string) {
  //   return await this.encryptionService.encryptColumnValue('org_environment_variables', workspaceId, value);
  // }

  // private async decryptSecret(workspaceId: string, value: string) {
  //   return await this.encryptionService.decryptColumnValue('org_environment_variables', workspaceId, value);
  // }
}
