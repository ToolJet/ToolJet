import { AppEnvironment } from '@entities/app_environments.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { DataQuery } from '@entities/data_query.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { catchDbException } from '@helpers/utils.helper';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, IsNull, Not, Repository } from 'typeorm';
import { decode } from 'js-base64';
import { App } from '@entities/app.entity';
import { v4 as uuid } from 'uuid';
import { APP_TYPES } from '@modules/apps/constants';

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
    manager?: EntityManager,
    branchId?: string
  ): Promise<AppVersion> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      // moduleReferenceId is module-only; look up parent app type once and gate.
      const parentApp = await manager.findOne(App, { where: { id: appId }, select: ['id', 'type'] });
      const isModule = parentApp?.type === APP_TYPES.MODULE;
      return catchDbException(() => {
        return manager.save(
          AppVersion,
          manager.create(AppVersion, {
            name: name,
            appId: appId,
            definition: definition,
            currentEnvironmentId: firstPriorityEnvId,
            status: AppVersionStatus.DRAFT,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...(isModule && { moduleReferenceId: uuid() }),
            ...(branchId && { branchId }),
          })
        );
      }, [{ dbConstraint: DataBaseConstraints.APP_VERSION_NAME_UNIQUE, message: 'Version name already exists.' }]);
    }, manager || this.manager);
  }

  findById(id: string, appId: string, relations?: string[], manager?: EntityManager): Promise<AppVersion> {
    const m = manager ?? this.manager;
    return m.findOneOrFail(AppVersion, {
      where: { id, appId },
      ...(relations?.length ? { relations } : {}),
    });
  }

  findByName(name: string, appId: string, relations?: string[], manager?: EntityManager): Promise<AppVersion> {
    const m = manager ?? this.manager;
    return m.findOneOrFail(AppVersion, {
      where: { name, appId },
      ...(relations?.length ? { relations } : {}),
    });
  }

  async findLatestVersionForEnvironment(
    appId: string,
    environmentId: string | null,
    environmentName: string | null,
    organizationId: string,
    manager?: EntityManager
  ): Promise<AppVersion | undefined> {
    const m = manager ?? this.manager;
    const prioritySubquery = m
      .createQueryBuilder()
      .subQuery()
      .select('priority')
      .from(AppEnvironment, 'env')
      .where('env.organizationId = :organizationId', { organizationId })
      .andWhere(environmentId ? 'env.id = :environmentId' : 'env.name = :environmentName')
      .getQuery();

    return m
      .createQueryBuilder(AppVersion, 'appVersion')
      .innerJoin(AppEnvironment, 'environment', 'appVersion.currentEnvironmentId = environment.id')
      .where('appVersion.appId = :appId', { appId })
      .andWhere('environment.organizationId = :organizationId', { organizationId })
      .andWhere(`environment.priority >= (${prioritySubquery})`)
      .andWhere('appVersion.version_type != :branchType')
      .orderBy('appVersion.createdAt', 'DESC')
      .setParameters({
        appId,
        organizationId,
        environmentId: environmentId || undefined,
        environmentName: environmentName || undefined,
        branchType: AppVersionType.BRANCH,
      })
      .getOne();
  }

  async findDataQueriesForVersion(appVersionId: string, manager?: EntityManager): Promise<DataQuery[]> {
    const m = manager ?? this.manager;
    return m.find(DataQuery, {
      where: { appVersionId },
      relations: ['dataSource'],
      select: { dataSource: { kind: true } },
    });
  }

  async findDataQueriesForVersionWithPermissions(appVersionId: string, manager?: EntityManager): Promise<DataQuery[]> {
    const m = manager ?? this.manager;
    return m
      .createQueryBuilder(DataQuery, 'query')
      .where('query.appVersionId = :appVersionId', { appVersionId })
      .leftJoinAndSelect('query.dataSource', 'dataSource')
      .leftJoinAndSelect('query.permissions', 'permission')
      .leftJoinAndSelect('permission.users', 'queryUser')
      .leftJoinAndSelect('queryUser.user', 'user')
      .leftJoinAndSelect('queryUser.permissionGroup', 'group')
      .select(['query', 'dataSource.kind', 'permission', 'queryUser', 'user', 'group'])
      .getMany();
  }

  async findVersion(id: string, manager?: EntityManager): Promise<AppVersion> {
    const m = manager ?? this.manager;
    const appVersion = await m.findOneOrFail(AppVersion, {
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
      for (const query of appVersion.dataQueries) {
        if (query?.plugin) {
          query.plugin.manifestFile.data = JSON.parse(decode(query.plugin.manifestFile.data.toString('utf8')));
        }
      }
    }
    return appVersion;
  }

  async findVersionWithQueryPermissions(id: string, manager?: EntityManager): Promise<AppVersion> {
    const m = manager ?? this.manager;
    const appVersion = await m
      .createQueryBuilder(AppVersion, 'appVersion')
      .where('appVersion.id = :id', { id })
      .leftJoinAndSelect('appVersion.app', 'app')
      .leftJoinAndSelect('appVersion.dataQueries', 'dataQueries')
      .leftJoinAndSelect('dataQueries.dataSource', 'dataSource')
      .leftJoinAndSelect('dataQueries.plugins', 'plugins')
      .leftJoinAndSelect('plugins.manifestFile', 'manifestFile')
      .leftJoinAndSelect('dataQueries.permissions', 'permission')
      .leftJoinAndSelect('permission.users', 'queryUser')
      .leftJoinAndSelect('queryUser.user', 'user')
      .leftJoinAndSelect('queryUser.permissionGroup', 'group')
      .getOneOrFail();

    if (appVersion?.dataQueries) {
      for (const query of appVersion.dataQueries) {
        if (query?.plugin) {
          query.plugin.manifestFile.data = JSON.parse(decode(query.plugin.manifestFile.data.toString('utf8')));
        }
      }
    }
    return appVersion;
  }

  getVersionsInApp(appId: string, branchId?: string, manager?: EntityManager): Promise<AppVersion[]> {
    const m = manager ?? this.manager;
    const where = branchId ? { appId, branchId, isStub: false } : { appId, isStub: false };
    return m.find(AppVersion, { where, order: { createdAt: 'DESC' } });
  }

  getCount(appId: string): Promise<number> {
    return this.manager.count(AppVersion, {
      where: { appId },
    });
  }

  deleteById(versionId: string, manager?: EntityManager): Promise<any> {
    const m = manager ?? this.manager;
    return m.delete(AppVersion, { id: versionId });
  }

  async findAppFromVersion(id: string, organizationId: string, manager?: EntityManager): Promise<App> {
    const m = manager ?? this.manager;
    const appVersion = await m.findOneOrFail(AppVersion, {
      where: { id, app: { organizationId } },
      relations: ['app'],
    });
    return appVersion.app;
  }

  async findVersionsFromApp(app: App, manager?: EntityManager): Promise<AppVersion[]> {
    const m = manager ?? this.manager;
    return m.find(AppVersion, {
      where: { appId: app.id },
      relations: [
        'app',
        'dataQueries',
        'dataQueries.dataSource',
        'dataQueries.plugins',
        'dataQueries.plugins.manifestFile',
      ],
    });
  }

  async getAppVersionById(versionId: string) {
    const version = await this.manager.findOneOrFail(AppVersion, {
      where: { id: versionId },
      relations: ['app'],
    });
    if (!version) throw new BadRequestException('Wrong version Id');
    return version;
  }

  async getAppVersionByIdOrName(versionId: string, appId?: string) {
    let version;
    try {
      version = await this.manager.findOneOrFail(AppVersion, {
        where: { name: versionId, appId },
        relations: ['app'],
      });
    } catch (error) {
      version = await this.manager.findOneOrFail(AppVersion, {
        where: { id: versionId },
        relations: ['app'],
      });
    }
    if (!version) throw new BadRequestException('Wrong version Id');
    return version;
  }

  async updateVersion(versionId: string, editableParams: Partial<AppVersion>, manager?: EntityManager): Promise<void> {
    const m = manager ?? this.manager;
    await m.update(AppVersion, { id: versionId }, { ...editableParams, updatedAt: new Date() });
  }

  async findParentVersionApps(versionId: string, manager?: EntityManager): Promise<AppVersion[]> {
    const m = manager ?? this.manager;
    return m.find(AppVersion, { where: { parentVersionId: versionId } });
  }

  async getAllVersions(appId: string, manager?: EntityManager): Promise<AppVersion[]> {
    const m = manager ?? this.manager;
    return m.find(AppVersion, { where: { appId }, relations: ['user'] });
  }
}
