import { Injectable } from '@nestjs/common';
import { EntityManager, FindOptionsOrderValue } from 'typeorm';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { IAppEnvironmentUtilService } from './interfaces/IUtilService';
import { AppVersion } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';
import { FindOneOptions } from 'typeorm';
import { defaultAppEnvironments } from '@helpers/utils.helper';

@Injectable()
export class AppEnvironmentUtilService implements IAppEnvironmentUtilService {
  constructor() {}
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

  async createDefaultEnvironments(organizationId: string, manager?: EntityManager): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await Promise.all(
        defaultAppEnvironments.map(async (env) => {
          const environment = manager.create(AppEnvironment, {
            organizationId,
            name: env.name,
            isDefault: env.isDefault,
            priority: env.priority,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await manager.save(environment);
        })
      );
    }, manager);
  }

  async getByPriority(organizationId: string, ASC = true, manager?: EntityManager): Promise<AppEnvironment> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const condition = {
        where: { organizationId },
        order: { priority: ASC ? 'ASC' : ('DESC' as FindOptionsOrderValue) },
      };
      return manager.findOneOrFail(AppEnvironment, condition);
    }, manager);
  }

  async getEnvironmentByName(name: string, organizationId: string, manager?: EntityManager): Promise<AppEnvironment> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.findOne(AppEnvironment, {
        where: { name, organizationId },
      });
    }, manager);
  }

  async getAllEnvironments(organizationId: string, manager?: EntityManager): Promise<AppEnvironment[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.find(AppEnvironment, { where: { organizationId } });
    }, manager);
  }

  async calculateButtonVisibility(
    isMultiEnvironmentEnabled: boolean,
    appVersionEnvironment?: AppEnvironment,
    appId?: string,
    versionId?: string,
    manager?: EntityManager
  ) {
    /* Further conditions can handle from here */
    if (!isMultiEnvironmentEnabled) {
      return {
        shouldRenderPromoteButton: false,
        shouldRenderReleaseButton: true,
      };
    }
    const appDetails = await manager.findOneOrFail(App, {
      select: ['id', 'currentVersionId'],
      where: { id: appId },
    });
    const isVersionReleased = appDetails.currentVersionId && appDetails.currentVersionId === versionId;
    const isCurrentVersionInProduction = appVersionEnvironment?.isDefault;
    const shouldRenderPromoteButton = !isCurrentVersionInProduction && !isVersionReleased;
    const shouldRenderReleaseButton = isCurrentVersionInProduction || isVersionReleased;
    return { shouldRenderPromoteButton, shouldRenderReleaseButton };
  }

  async getSelectedVersion(selectedEnvironmentId: string, appId: string, manager?: EntityManager): Promise<any> {
    const subquery = manager
      .createQueryBuilder(AppEnvironment, 'innerEnv')
      .select('innerEnv.priority')
      .where('innerEnv.id = :selectedEnvironmentId', { selectedEnvironmentId });

    const result = await manager
      .createQueryBuilder(AppVersion, 'appVersion')
      .select(['appVersion.name', 'appVersion.id', 'appVersion.currentEnvironmentId'])
      .innerJoin(AppEnvironment, 'env', 'appVersion.currentEnvironmentId = env.id')
      .where(`env.priority >= (${subquery.getQuery()})`)
      .setParameters(subquery.getParameters())
      .andWhere('appVersion.appId = :appId', { appId })
      .orderBy('appVersion.updatedAt', 'DESC')
      .limit(1)
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      name: result.appVersion_name,
      id: result.appVersion_id,
      currentEnvironmentId: result.appVersion_currentEnvironmentId,
    };
  }

  async get(
    organizationId: string,
    id?: string,
    priorityCheck = false,
    manager?: EntityManager,
    licenseCheck = false
  ): Promise<AppEnvironment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const condition: FindOneOptions<AppEnvironment> = {
        where: {
          organizationId,
          ...(id ? { id } : !priorityCheck && { isDefault: true }),
        },
        ...(priorityCheck && { order: { priority: 'ASC' } }),
      };
      return await manager.findOneOrFail(AppEnvironment, condition);
    }, manager);
  }

  async getAll(organizationId: string, appId?: string, manager?: EntityManager): Promise<AppEnvironment[]> {
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
              ...(appEnvironment.priority !== 1 && {
                currentEnvironmentId: appEnvironment.id,
              }),
              appId,
            },
          });

          appEnvironment.appVersionsCount = count;
        }
      }

      return appEnvironments;
    }, manager);
  }

  async getOptions(dataSourceId: string, organizationId: string, environmentId?: string): Promise<DataSourceOptions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let envId: string = environmentId;
      if (!environmentId) {
        envId = (await this.get(organizationId, null, false, manager)).id;
      }
      return await manager.findOneOrFail(DataSourceOptions, {
        where: { environmentId: envId, dataSourceId },
      });
    });
  }
}
