import { Injectable } from '@nestjs/common';
import { DeleteResult, EntityManager } from 'typeorm';
import { CreateOrganizationConstantDto, UpdateOrganizationConstantDto } from '@modules/organization-constants/dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { OrganizationConstant } from '@entities/organization_constants.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { IOrganizationConstantsService } from './interfaces/IService';
import { OrganizationConstantsUtilService } from './util.service';
import { OrganizationConstantType } from './constants';
import { OrganizationConstantRepository } from './repository';

@Injectable()
export class OrganizationConstantsService implements IOrganizationConstantsService {
  constructor(
    protected readonly organizationConstantRepository: OrganizationConstantRepository,
    protected readonly organizationConstantsUtilService: OrganizationConstantsUtilService,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService
  ) {}

  async allEnvironmentConstants(
    organizationId: string,
    decryptSecretValue?: boolean,
    type?: OrganizationConstantType
  ): Promise<OrganizationConstant[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const result = await this.organizationConstantRepository.findAllByOrganizationId(organizationId);
      const appEnvironments = await this.appEnvironmentUtilService.getAll(organizationId);

      const constantsWithValues = await Promise.all(
        result.map(async (constant) => {
          const values = await Promise.all(
            appEnvironments.map(async (env) => {
              const value = constant.orgEnvironmentConstantValues.find((value) => value.environmentId === env.id);

              return {
                environmentName: env.name,
                value:
                  value && value.value.length > 0
                    ? await this.organizationConstantsUtilService.decryptSecret(organizationId, value.value)
                    : '',
                id: value.environmentId,
              };
            })
          );

          return {
            id: constant.id,
            name: constant.constantName,
            values,
            createdAt: constant.createdAt,
            type: constant.type,
          };
        })
      );

      return constantsWithValues;
    });
  }

  async getConstantsForEnvironment(
    organizationId: string,
    environmentId: string,
    type?: OrganizationConstantType
  ): Promise<any[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const result = await this.organizationConstantRepository.findByEnvironment(organizationId, environmentId);

      const constantsWithValues = result.map(async (constant) => {
        const decryptedValue = await this.organizationConstantsUtilService.decryptSecret(
          organizationId,
          constant.orgEnvironmentConstantValues[0].value
        );
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
    organizationId: string,
    isMultiEnvEnabled?: boolean
  ): Promise<OrganizationConstant | []> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const newOrganizationConstant = this.organizationConstantRepository.create({
        constantName: organizationConstant.constant_name,
        organizationId,
        type: organizationConstant.type,
      });

      const savedOrganizationConstant = await manager.save(OrganizationConstant, newOrganizationConstant);

      // Creating empty options mapping for the constant
      await this.organizationConstantsUtilService.createOrgConstantsInAllEnvironments(
        organizationId,
        savedOrganizationConstant.id,
        manager
      );

      let environmentsToUpdate = [];
      if (isMultiEnvEnabled) {
        const environmentsIds = organizationConstant.environments;
        environmentsToUpdate = environmentsIds.map(async (environmentId) => {
          return await this.appEnvironmentUtilService.get(organizationId, environmentId, false);
        });
      } else {
        /* 
          Basic plan customer. lets update all environment constant values. 
          this will help us to run the apps successfully when the user buys enterprise plan 
        */
        environmentsToUpdate = await this.appEnvironmentUtilService.getAll(organizationId);
      }

      await Promise.all(
        environmentsToUpdate.map(async (environment) => {
          const encryptedValue = await this.organizationConstantsUtilService.encryptSecret(
            organizationId,
            organizationConstant.value
          );
          await this.organizationConstantsUtilService.updateOrgEnvironmentConstant(
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
      const constantToUpdate = await this.organizationConstantRepository.findOne({
        where: { id: constantId, organizationId },
      });

      if (!constantToUpdate) {
        throw new Error('Constant not found');
      }

      if (constant_name) {
        constantToUpdate.constantName = constant_name;
      }

      await manager.save(constantToUpdate);

      const environmentToUpdate = await this.appEnvironmentUtilService.get(organizationId, environment_id, false);
      const encryptedValue = await this.organizationConstantsUtilService.encryptSecret(organizationId, value);

      await this.organizationConstantsUtilService.updateOrgEnvironmentConstant(
        encryptedValue,
        environmentToUpdate.id,
        constantToUpdate.id,
        manager
      );

      return constantToUpdate;
    });
  }

  async delete(constantId: string, organizationId: string, environmentId?: string): Promise<DeleteResult> {
    return await this.organizationConstantsUtilService.deleteOrgEnvironmentConstant(
      constantId,
      organizationId,
      environmentId
    );
  }
}
