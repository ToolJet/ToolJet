import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';

@Injectable()
export class AppEnvironmentService {
  async get(appVersionId: string, id?: string, manager?: EntityManager): Promise<AppEnvironment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (!id) {
        return await manager.findOneOrFail(AppEnvironment, { where: { appVersionId, isDefault: true } });
      }
      return await manager.findOneOrFail(AppEnvironment, { where: { id, appVersionId } });
    }, manager);
  }

  async getOptions(dataSourceId: string, versionId?: string, environmentId?: string): Promise<DataSourceOptions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let envId: string = environmentId;
      if (!environmentId) {
        envId = (await this.get(versionId, null, manager)).id;
      }
      return await manager.findOneOrFail(DataSourceOptions, { where: { environmentId: envId, dataSourceId } });
    });
  }

  async create(
    appVersionId: string,
    name: string,
    isDefault = false,
    manager?: EntityManager
  ): Promise<AppEnvironment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        AppEnvironment,
        manager.create(AppEnvironment, {
          name,
          appVersionId,
          isDefault,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    }, manager);
  }

  async getAll(appVersionId: string, manager?: EntityManager): Promise<AppEnvironment[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.find(AppEnvironment, { where: { appVersionId } });
    }, manager);
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

  async createDataSourceInAllEnvironments(appVersionId: string, dataSourceId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const allEnvs = await this.getAll(appVersionId, manager);
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
