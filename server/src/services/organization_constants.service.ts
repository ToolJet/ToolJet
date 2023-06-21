import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationConstant } from '../entities/organization_constants.entity';
// import { User } from '../entities/user.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EncryptionService } from './encryption.service';
import { AppEnvironmentService } from './app_environments.service';

import { EntityManager, Repository } from 'typeorm';
import { CreateOrganizationConstantDto } from '@dto/organization-constant.dto';

@Injectable()
export class OrganizationConstantsService {
  constructor(
    @InjectRepository(OrganizationConstant)
    private organizationConstantsRepository: Repository<OrganizationConstant>,
    private encryptionService: EncryptionService,
    private appEnvironmentService: AppEnvironmentService
  ) {}

  async fetchVariables(organizationId: string): Promise<OrganizationConstant[]> {
    console.log('fetching variables------', { organizationId });

    return [];
  }

  async create(
    organizationConstant: CreateOrganizationConstantDto,
    organizationId: string
  ): Promise<OrganizationConstant> {
    console.log('creating constant------', { organizationConstant, organizationId });

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

  // private async encryptSecret(workspaceId: string, value: string) {
  //   return await this.encryptionService.encryptColumnValue('org_environment_variables', workspaceId, value);
  // }

  // private async decryptSecret(workspaceId: string, value: string) {
  //   return await this.encryptionService.decryptColumnValue('org_environment_variables', workspaceId, value);
  // }
}
