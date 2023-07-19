import { Injectable } from '@nestjs/common';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { dbTransactionWrap, defaultAppEnvironments } from 'src/helpers/utils.helper';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { OrgEnvironmentConstantValue } from 'src/entities/org_environment_constant_values.entity';
import { OrganizationConstant } from 'src/entities/organization_constants.entity';
import { EntityManager, FindOneOptions, In, DeleteResult } from 'typeorm';
import { AppVersion } from 'src/entities/app_version.entity';

@Injectable()
export class AppEnvironmentService {
  async get(
    organizationId: string,
    id?: string,
    priorityCheck = false,
    manager?: EntityManager
  ): Promise<AppEnvironment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const condition: FindOneOptions<AppEnvironment> = {
        where: { organizationId, ...(id ? { id } : !priorityCheck && { isDefault: true }) },
        ...(priorityCheck && { order: { priority: 'ASC' } }),
      };
      return await manager.findOneOrFail(AppEnvironment, condition);
    }, manager);
  }

  async getOptions(dataSourceId: string, organizationId: string, environmentId?: string): Promise<DataSourceOptions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let envId: string = environmentId;
      if (!environmentId) {
        envId = (await this.get(organizationId, null, false, manager)).id;
      }
      return await manager.findOneOrFail(DataSourceOptions, { where: { environmentId: envId, dataSourceId } });
    });
  }

  async create(
    organizationId: string,
    name: string,
    isDefault = false,
    priority: number,
    manager?: EntityManager
  ): Promise<AppEnvironment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        AppEnvironment,
        manager.create(AppEnvironment, {
          name,
          organizationId,
          isDefault,
          priority,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    }, manager);
  }

  async getAll(organizationId: string, manager?: EntityManager, appId?: string): Promise<AppEnvironment[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const appEnvironments = await manager.find(AppEnvironment, {
        where: {
          organizationId,
          enabled: true,
        },
        order: {
          priority: 'ASC',
        },
      });

      if (appId) {
        for (const appEnvironment of appEnvironments) {
          const count = await manager.count(AppVersion, {
            where: {
              ...(appEnvironment.priority !== 1 && { currentEnvironmentId: appEnvironment.id }),
              appId,
            },
          });

          appEnvironment['appVersionsCount'] = count;
        }
      }

      return appEnvironments;
    }, manager);
  }

  async getVersionsByEnvironment(organizationId: string, appId: string, currentEnvironmentId?: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const conditions = { appId };
      if (currentEnvironmentId) {
        const env = await this.get(organizationId, currentEnvironmentId, false, manager);
        if (env.priority !== 1) {
          /* staging environment
           * this logic will change in future if there is more than 3 environments
           */
          if (env.priority === 2) {
            const productionEnv = await manager.findOne(AppEnvironment, {
              where: {
                isDefault: true,
                organizationId,
              },
              select: ['id'],
            });
            conditions['currentEnvironmentId'] = In([productionEnv.id, currentEnvironmentId]);
          } else {
            conditions['currentEnvironmentId'] = currentEnvironmentId;
          }
        }
      }

      return await manager.find(AppVersion, {
        where: { ...conditions },
        order: {
          createdAt: 'DESC',
        },
      });
    });
  }

  async updateOptions(options: object, environmentId: string, dataSourceId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        DataSourceOptions,
        {
          environmentId,
          dataSourceId,
        },
        { options, updatedAt: new Date() }
      );
    }, manager);
  }

  async createDefaultEnvironments(organizationId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await Promise.all(
        defaultAppEnvironments.map(async (en) => {
          const env = manager.create(AppEnvironment, {
            organizationId: organizationId,
            name: en.name,
            isDefault: en.isDefault,
            priority: en.priority,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await manager.save(env);
        })
      );
    }, manager);
  }

  async createDataSourceInAllEnvironments(organizationId: string, dataSourceId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const allEnvs = await this.getAll(organizationId, manager);
      const allEnvOptions = allEnvs.map((env) =>
        manager.create(DataSourceOptions, {
          environmentId: env.id,
          dataSourceId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      await manager.save(DataSourceOptions, allEnvOptions);
    }, manager);
  }

  async createOrgConstantsInAllEnvironments(organizationId: string, orgConstantId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const allEnvs = await this.getAll(organizationId, manager);

      const allEnvConstants = allEnvs.map((env) =>
        manager.create(OrgEnvironmentConstantValue, {
          organizationConstantId: orgConstantId,
          environmentId: env.id,
          value: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
      await manager.save(OrgEnvironmentConstantValue, allEnvConstants);
    }, manager);
  }

  async updateOrgEnvironmentConstant(
    constantValue: string,
    environmentId: string,
    orgConstantId: string,
    manager?: EntityManager
  ) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        OrgEnvironmentConstantValue,
        {
          environmentId,
          organizationConstantId: orgConstantId,
        },
        { value: constantValue, updatedAt: new Date() }
      );
    }, manager);
  }

  async getOrgEnvironmentConstant(
    constantName: string,
    organizationId: string,
    environmentId: string,
    manager?: EntityManager
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let envId: string = environmentId;
      if (!environmentId) {
        envId = (await this.get(organizationId, environmentId, null, manager)).id;
      }

      const constantId = (await manager.findOne(OrganizationConstant, { where: { constantName, organizationId } })).id;

      return await manager.findOneOrFail(OrgEnvironmentConstantValue, {
        where: { organizationConstantId: constantId, environmentId: envId },
      });
    }, manager);
  }

  async deleteOrgEnvironmentConstant(
    constantId: string,
    organizationId: string,
    environmentId: string
  ): Promise<DeleteResult> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const constantToDelete = await manager.findOne(OrganizationConstant, {
        where: { id: constantId, organizationId },
        relations: ['orgEnvironmentConstantValues'],
      });

      if (!constantToDelete) {
        throw new Error('Constant not found');
      }

      if (constantToDelete.orgEnvironmentConstantValues.length === 1) {
        return await manager.delete(OrganizationConstant, { id: constantId });
      } else {
        const environmentValueToDelete = constantToDelete.orgEnvironmentConstantValues.find(
          (value) => value.environmentId === environmentId
        );

        if (!environmentValueToDelete) {
          throw new Error('Environment value not found');
        }

        return await manager.update(
          OrgEnvironmentConstantValue,
          { id: environmentValueToDelete.id },
          { value: '', updatedAt: new Date() }
        );
      }
    });
  }
}
