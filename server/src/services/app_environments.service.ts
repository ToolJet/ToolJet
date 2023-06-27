import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { dbTransactionWrap, defaultAppEnvironments } from 'src/helpers/utils.helper';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
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
      if (priorityCheck && !id) {
        return await manager.findOneOrFail(AppEnvironment, { where: { organizationId }, order: { priority: 'ASC' } });
      }
      if (!id) {
        return await manager.findOneOrFail(AppEnvironment, { where: { organizationId, isDefault: true } });
      }
      return await manager.findOneOrFail(AppEnvironment, { where: { id, organizationId } });
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

  async getAll(organizationId: string, manager?: EntityManager): Promise<AppEnvironment[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.find(AppEnvironment, {
        where: {
          organizationId,
          enabled: true,
        },
        order: {
          priority: 'ASC',
        },
      });
    }, manager);
  }

  async getVersionsByEnvironment(organizationId: string, appId: string, currentEnvironmentId?: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const conditions = { appId };
      if (currentEnvironmentId) {
        const env = await this.get(organizationId, currentEnvironmentId, false, manager);
        if (env.priority !== 1) conditions['currentEnvironmentId'] = currentEnvironmentId;
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
}
