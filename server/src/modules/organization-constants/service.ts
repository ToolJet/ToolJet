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
import { BranchContextService } from '@modules/workspace-branches/branch-context.service';
import { OrganizationConstantVersion } from '@entities/organization_constant_version.entity';
import { OrganizationConstantVersionValue } from '@entities/organization_constant_version_values.entity';
const secretValue = '**********';
@Injectable()
export class OrganizationConstantsService implements IOrganizationConstantsService {
  constructor(
    protected readonly organizationConstantRepository: OrganizationConstantRepository,
    protected readonly organizationConstantsUtilService: OrganizationConstantsUtilService,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly branchContextService: BranchContextService
  ) {}

  async allEnvironmentConstants(
    organizationId: string,
    decryptSecretValue?: boolean,
    type?: OrganizationConstantType
  ): Promise<OrganizationConstant[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const result = await this.organizationConstantRepository.findAllByOrganizationId(organizationId, type);
      const appEnvironments = await this.appEnvironmentUtilService.getAll(organizationId);
      const branchId = await this.branchContextService.getActiveBranchId(organizationId);

      const constantsWithValues = await Promise.all(
        result.map(async (constant) => {
          // Skip processing values if type is SECRET and decryptSecretValue is false
          if (constant.type === OrganizationConstantType.SECRET && !decryptSecretValue) {
            return {
              name: constant.constantName,
            };
          }

          // Branch-aware: check if constant is active on branch
          let cv: OrganizationConstantVersion | null = null;
          if (branchId) {
            cv = await manager.findOne(OrganizationConstantVersion, {
              where: { organizationConstantId: constant.id, branchId },
            });
            // No version entry or inactive → constant doesn't exist on this branch
            if (!cv || !cv.isActive) {
              return null;
            }
          }

          const values = await Promise.all(
            appEnvironments.map(async (env) => {
              let resolvedValue = '';

              // Branch-aware: read from version values if available
              if (cv) {
                const versionValue = await manager.findOne(OrganizationConstantVersionValue, {
                  where: { constantVersionId: cv.id, environmentId: env.id },
                });
                if (versionValue) {
                  if (constant.type === OrganizationConstantType.SECRET) {
                    resolvedValue = decryptSecretValue
                      ? await this.organizationConstantsUtilService.decryptSecret(organizationId, versionValue.value)
                      : secretValue;
                  } else {
                    resolvedValue = await this.organizationConstantsUtilService.decryptSecret(
                      organizationId,
                      versionValue.value
                    );
                  }
                }
              } else {
                const value = constant.orgEnvironmentConstantValues.find((value) => value.environmentId === env.id);
                if (value) {
                  if (constant.type === OrganizationConstantType.SECRET) {
                    resolvedValue = decryptSecretValue
                      ? await this.organizationConstantsUtilService.decryptSecret(organizationId, value.value)
                      : secretValue;
                  } else {
                    resolvedValue = await this.organizationConstantsUtilService.decryptSecret(
                      organizationId,
                      value.value
                    );
                  }
                }
              }

              return {
                environmentName: env.name,
                value: resolvedValue,
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

      // Filter out null entries (soft-deleted on branch)
      return constantsWithValues.filter(Boolean);
    });
  }

  async getConstantsForEnvironment(
    organizationId: string,
    environmentId: string,
    type?: OrganizationConstantType
  ): Promise<any[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const branchId = await this.branchContextService.getActiveBranchId(organizationId);

      if (branchId) {
        // Branch-aware: query through organization_constant_versions + version_values
        const query = manager
          .createQueryBuilder(OrganizationConstant, 'organization_constants')
          .innerJoin(
            'organization_constant_versions',
            'ocv',
            'ocv.organization_constant_id = organization_constants.id AND ocv.branch_id = :branchId AND ocv.is_active = true',
            { branchId }
          )
          .innerJoinAndSelect(
            'organization_constant_version_values',
            'ocvv',
            'ocvv.constant_version_id = ocv.id AND ocvv.environment_id = :environmentId',
            { environmentId }
          )
          .where('organization_constants.organization_id = :organizationId', { organizationId });

        if (type) {
          query.andWhere('organization_constants.type = :type', { type });
        }

        const result = await query.getMany();

        return await Promise.all(
          result.map(async (constant) => {
            const rawValue = (constant as any).ocvv_value || '';
            const resolvedValue = !(constant.type === OrganizationConstantType.SECRET)
              ? await this.organizationConstantsUtilService.decryptSecret(organizationId, rawValue)
              : secretValue;

            return {
              id: constant.id,
              name: constant.constantName,
              type: constant.type,
              value: resolvedValue,
            };
          })
        );
      }

      // Non-branched fallback (existing behavior)
      const result = await this.organizationConstantRepository.findByEnvironment(organizationId, environmentId, type);

      return await Promise.all(
        result.map(async (constant) => {
          const resolvedValue = !(constant.type === OrganizationConstantType.SECRET)
            ? await this.organizationConstantsUtilService.decryptSecret(
                organizationId,
                constant.orgEnvironmentConstantValues[0].value
              )
            : secretValue;

          return {
            id: constant.id,
            name: constant.constantName,
            type: constant.type,
            value: resolvedValue,
          };
        })
      );
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
            (await environment).id,
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
    params: UpdateOrganizationConstantDto,
    isMultiEnvironmentEnabled = false
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
      let environmentsToUpdate = [];
      if (!isMultiEnvironmentEnabled) {
        environmentsToUpdate = await this.appEnvironmentUtilService.getAll(organizationId);
      } else {
        const environment = await this.appEnvironmentUtilService.get(organizationId, environment_id, false);
        environmentsToUpdate.push(environment);
      }

      if (value) {
        await Promise.all(
          environmentsToUpdate.map(async (environment) => {
            const encryptedValue = await this.organizationConstantsUtilService.encryptSecret(organizationId, value);
            await this.organizationConstantsUtilService.updateOrgEnvironmentConstant(
              encryptedValue,
              environment.id,
              constantToUpdate.id,
              manager
            );
          })
        );
      }

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
