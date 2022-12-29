import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager, Repository, UpdateResult } from 'typeorm';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';

// async create(versionId: string, name: string, isDefault = false, manager?: EntityManager): Promise<AppEnvironment> {

@Injectable()
export class AppEnvironmentService {
  constructor(
    @InjectRepository(AppEnvironment)
    private appEnvRepository: Repository<AppEnvironment>,
    @InjectRepository(AppVersion)
    private appVersionRepository: Repository<AppVersion>
  ) {}

  async get(appVersionId: string, id?: string, manager?: EntityManager): Promise<AppEnvironment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (!id) {
        return await manager.findOneOrFail(AppEnvironment, {
          where: { appVersionId, isDefault: true },
          relations: ['appVersion'],
        });
      }
      return await manager.findOneOrFail(AppEnvironment, { where: { id, appVersionId }, relations: ['appVersion'] });
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

  async update(id: string, name: string, appVersionId: string): Promise<UpdateResult> {
    return this.appEnvRepository.update({ id, appVersionId }, { name });
  }

  async getAll(appVersionId: string, manager?: EntityManager): Promise<AppEnvironment[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.find(AppEnvironment, { where: { appVersionId } });
    }, manager);
  }

  async delete(id: string, appVersionId: string) {
    const env = await this.appEnvRepository.findOne({
      id,
      appVersionId,
    });

    if (env.isDefault) {
      throw Error("Can't delete the default environment");
    }

    return await this.appEnvRepository.delete({ id, appVersionId });
  }

  async getVersion(id: string) {
    return this.appVersionRepository.findOne(id);
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
