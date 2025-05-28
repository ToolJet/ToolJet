import { AppEnvironment } from '@entities/app_environments.entity';
import { AppVersion } from '@entities/app_version.entity';
import { DataQuery } from '@entities/data_query.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { catchDbException } from '@helpers/utils.helper';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { decode } from 'js-base64';
import { App } from '@entities/app.entity';

@Injectable()
export class VersionRepository extends Repository<AppVersion> {
  constructor(private dataSource: DataSource) {
    super(AppVersion, dataSource.createEntityManager());
  }

  async createOne(
    name: string,
    appId: string,
    firstPriorityEnvId: string,
    definition?: any,
    manager?: EntityManager
  ): Promise<AppVersion> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return catchDbException(() => {
        return manager.save(
          AppVersion,
          manager.create(AppVersion, {
            name: name,
            appId: appId,
            definition: definition,
            currentEnvironmentId: firstPriorityEnvId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
      }, [{ dbConstraint: DataBaseConstraints.APP_VERSION_NAME_UNIQUE, message: 'Version name already exists.' }]);
    }, manager || this.manager);
  }

  findById(id: string, appId: string, relations?: string[], manager?: EntityManager): Promise<AppVersion> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOneOrFail(AppVersion, {
        where: { id, appId },
        ...(relations?.length ? { relations } : {}),
      });
    }, manager || this.manager);
  }

  findByName(name: string, appId: string, relations?: string[], manager?: EntityManager): Promise<AppVersion> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOneOrFail(AppVersion, {
        where: { name, appId },
        ...(relations?.length ? { relations } : {}),
      });
    }, manager || this.manager);
  }

  async findLatestVersionForEnvironment(
    appId: string,
    environmentId: string | null,
    environmentName: string | null,
    organizationId: string,
    manager?: EntityManager
  ): Promise<AppVersion | undefined> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Subquery to determine the priority of the given environment
      const prioritySubquery = manager
        .createQueryBuilder()
        .subQuery()
        .select('priority')
        .from(AppEnvironment, 'env')
        .where('env.organizationId = :organizationId', { organizationId })
        .andWhere(environmentId ? 'env.id = :environmentId' : 'env.name = :environmentName')
        .getQuery();

      const query = manager
        .createQueryBuilder(AppVersion, 'appVersion')
        .innerJoin(AppEnvironment, 'environment', 'appVersion.currentEnvironmentId = environment.id')
        .where('appVersion.appId = :appId', { appId })
        .andWhere('environment.organizationId = :organizationId', { organizationId })
        .andWhere(`environment.priority >= (${prioritySubquery})`)
        .orderBy('appVersion.createdAt', 'DESC')
        .setParameters({
          appId,
          organizationId,
          environmentId: environmentId || undefined,
          environmentName: environmentName || undefined,
        });

      return await query.getOne();
    }, manager || this.manager);
  }

  async findDataQueriesForVersion(appVersionId: string, manager?: EntityManager): Promise<DataQuery[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(DataQuery, {
        where: { appVersionId },
        relations: ['dataSource'],
        select: {
          dataSource: {
            kind: true,
          },
        },
      });
    }, manager || this.manager);
  }

  async findDataQueriesForVersionWithPermissions(appVersionId: string, manager?: EntityManager): Promise<DataQuery[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager
        .createQueryBuilder(DataQuery, 'query')
        .where('query.appVersionId = :appVersionId', { appVersionId })
        .leftJoinAndSelect('query.dataSource', 'dataSource')
        .leftJoinAndSelect('query.permissions', 'permission')
        .leftJoinAndSelect('permission.users', 'queryUser')
        .leftJoinAndSelect('queryUser.user', 'user')
        .leftJoinAndSelect('queryUser.permissionGroup', 'group')
        .select(['query', 'dataSource.kind', 'permission', 'queryUser', 'user', 'group'])
        .getMany();
    }, manager || this.manager);
  }

  async findVersion(id: string, manager?: EntityManager): Promise<AppVersion> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const appVersion = await manager.findOneOrFail(AppVersion, {
        where: { id },
        relations: [
          'app',
          'dataQueries',
          'dataQueries.dataSource',
          'dataQueries.plugins',
          'dataQueries.plugins.manifestFile',
        ],
      });

      if (appVersion?.dataQueries) {
        for (const query of appVersion?.dataQueries) {
          if (query?.plugin) {
            query.plugin.manifestFile.data = JSON.parse(decode(query.plugin.manifestFile.data.toString('utf8')));
          }
        }
      }

      return appVersion;
    }, manager || this.manager);
  }

  getVersionsInApp(appId: string, manager?: EntityManager): Promise<AppVersion[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(AppVersion, {
        where: { appId },
        order: {
          createdAt: 'DESC',
        },
      });
    }, manager || this.manager);
  }

  getCount(appId: string): Promise<number> {
    return this.manager.count(AppVersion, {
      where: { appId },
    });
  }

  deleteById(versionId: string, manager?: EntityManager): Promise<any> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.delete(AppVersion, { id: versionId });
    }, manager || this.manager);
  }

  async findAppFromVersion(id: string, organizationId: string, manager?: EntityManager): Promise<App> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const appVersion = await manager.findOneOrFail(AppVersion, {
        where: { id, app: { organizationId } },
        relations: ['app'],
      });
      return appVersion.app;
    }, manager || this.manager);
  }
}
