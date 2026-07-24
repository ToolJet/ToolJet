import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager, FindOptionsOrderValue } from 'typeorm';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { dbTransactionWrap, getConnectionInstance } from 'src/helpers/database.helper';
import { IAppEnvironmentUtilService } from './interfaces/IUtilService';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { FindOneOptions } from 'typeorm';
import { defaultAppEnvironments } from '@helpers/utils.helper';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { IAppEnvironmentResponse } from './interfaces/IAppEnvironmentResponse';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { DataSourceVersionOptions } from '@entities/data_source_version_options.entity';
import { RequestContext } from '@modules/request-context/service';

const ENV_MEMO_KEY = 'tj_appenv_memo';

@Injectable()
export class AppEnvironmentUtilService implements IAppEnvironmentUtilService {
  constructor(protected readonly licenseTermsService: LicenseTermsService) {}
  async updateOptions(options: object, environmentId: string, dataSourceId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const defaultDsv = await manager.findOne(DataSourceVersion, {
        where: { dataSourceId, isDefault: true },
      });
      if (defaultDsv) {
        const dsvo = await manager.findOne(DataSourceVersionOptions, {
          where: { dataSourceVersionId: defaultDsv.id, environmentId },
        });
        if (dsvo) {
          await manager.update(DataSourceVersionOptions, { id: dsvo.id }, { options, updatedAt: new Date() });
        } else {
          await manager.save(
            manager.create(DataSourceVersionOptions, {
              dataSourceVersionId: defaultDsv.id,
              environmentId,
              options,
            })
          );
        }
      }
    }, manager);
  }

  async updateVersionOptions(
    options: object,
    dataSourceVersionId: string,
    environmentId: string,
    manager?: EntityManager
  ) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        DataSourceVersionOptions,
        {
          dataSourceVersionId,
          environmentId,
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
    const memoKey = `byPriority:${organizationId}:${ASC ? 'ASC' : 'DESC'}`;
    const cached = this.#getMemo(memoKey);
    if (cached) return cached;

    const m = manager ?? getConnectionInstance().manager;
    const env = await m.findOneOrFail(AppEnvironment, {
      where: { organizationId },
      order: { priority: ASC ? 'ASC' : ('DESC' as FindOptionsOrderValue) },
    });
    this.#setMemo(memoKey, env);
    return env;
  }

  async getEnvironmentByName(name: string, organizationId: string, manager?: EntityManager): Promise<AppEnvironment> {
    const m = manager ?? getConnectionInstance().manager;
    return m.findOne(AppEnvironment, { where: { name, organizationId } });
  }

  async getAllEnvironments(organizationId: string, manager?: EntityManager): Promise<AppEnvironment[]> {
    const m = manager ?? getConnectionInstance().manager;
    return m.find(AppEnvironment, { where: { organizationId } });
  }

  #getMemo(key: string): AppEnvironment | undefined {
    const ctx = RequestContext.currentContext;
    const memo = ctx?.res?.locals?.[ENV_MEMO_KEY] as Record<string, AppEnvironment> | undefined;
    return memo?.[key];
  }

  #setMemo(key: string, env: AppEnvironment): void {
    const ctx = RequestContext.currentContext;
    if (!ctx) return;
    const memo = (ctx.res?.locals?.[ENV_MEMO_KEY] as Record<string, AppEnvironment>) ?? {};
    memo[key] = env;
    RequestContext.setLocals(ENV_MEMO_KEY, memo);
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
      .select([
        'appVersion.name',
        'appVersion.id',
        'appVersion.currentEnvironmentId',
        'appVersion.versionType',
        'appVersion.branchId',
      ])
      .addSelect('branch.branch_name', 'branch_name')
      .leftJoin(WorkspaceBranch, 'branch', 'appVersion.branch_id = branch.id')
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

    const versionType = result.appVersion_version_type;
    const branchName = result.branch_name;

    return {
      name: result.appVersion_name,
      id: result.appVersion_id,
      currentEnvironmentId: result.appVersion_current_environment_id,
      current_environment_id: result.appVersion_current_environment_id,
      versionType,
      ...(versionType === AppVersionType.BRANCH && branchName ? { displayName: branchName } : {}),
    };
  }

  /**
   * Resolves the effective environment ID, respecting license restrictions.
   * Throws ForbiddenException if a non-dev environment is requested without multi-environment license.
   * If no environment is requested, defaults to the development environment.
   */
  async resolveEnvironmentId(
    organizationId: string,
    requestedEnvironmentId?: string,
    manager?: EntityManager
  ): Promise<string> {
    const isMultiEnvEnabled = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.MULTI_ENVIRONMENT,
      organizationId
    );

    const devEnv = await this.getByPriority(organizationId, true, manager);

    if (!isMultiEnvEnabled && requestedEnvironmentId && requestedEnvironmentId !== devEnv.id) {
      throw new ForbiddenException(
        'Multi-environment is not enabled for this organization. Please contact the super admin.'
      );
    }

    return requestedEnvironmentId || devEnv.id;
  }

  async get(
    organizationId: string,
    id?: string,
    priorityCheck = false,
    manager?: EntityManager
  ): Promise<AppEnvironment> {
    const isMultiEnvironmentEnabled = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.MULTI_ENVIRONMENT,
      organizationId
    );

    const memoKey = `get:${organizationId}:${id ?? '_'}:${isMultiEnvironmentEnabled ? 'multi' : 'single'}:${priorityCheck ? 'pri' : 'def'}`;
    const cached = this.#getMemo(memoKey);
    if (cached) return cached;

    const m = manager ?? getConnectionInstance().manager;
    const condition: FindOneOptions<AppEnvironment> = {
      where: {
        organizationId,
        ...(id ? { id } : !isMultiEnvironmentEnabled ? { priority: 1 } : !priorityCheck ? { isDefault: true } : {}),
      },
      ...(priorityCheck && { order: { priority: 'ASC' } }),
    };
    const env = await m.findOneOrFail(AppEnvironment, condition);
    this.#setMemo(memoKey, env);
    return env;
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

  async getOptions(
    dataSourceId: string,
    organizationId: string,
    environmentId?: string,
    branchId?: string
  ): Promise<DataSourceVersionOptions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let envId: string = environmentId;
      let envName: string;

      if (!environmentId) {
        const environment = await this.get(organizationId, null, false, manager);
        envId = environment.id;
        envName = environment.name;
      } else {
        // Fetch environment name for the given environment ID
        const environment = await manager.findOne(AppEnvironment, {
          where: { id: envId, organizationId },
          select: ['name'],
        });
        envName = environment?.name || 'unknown';
      }

      // Branch-aware path: read from data_source_version_options for a specific branch
      if (branchId) {
        const dsv = await manager.findOne(DataSourceVersion, {
          where: { dataSourceId, branchId, isActive: true },
        });
        if (dsv) {
          const dsvo = await manager.findOne(DataSourceVersionOptions, {
            where: { dataSourceVersionId: dsv.id, environmentId: envId },
          });
          if (dsvo) {
            const result = {
              id: dsvo.id,
              options: dsvo.options,
              environmentId: envId,
              dataSourceId,
              createdAt: dsvo.createdAt,
              updatedAt: dsvo.updatedAt,
              environmentName: envName,
            } as any;
            return result;
          }
        }
      }

      // Removed: appVersionId-specific DSV lookup (app_version_id dropped from data_source_versions).
      // Released versions now fall through to the default DSV path below.
      // if (appVersionId) { ... where: { dataSourceId, appVersionId, isActive: true } ... }

      // Default version path: read from data_source_version_options via default DSV
      const defaultDsv = await manager.findOne(DataSourceVersion, {
        where: { dataSourceId, isDefault: true },
      });
      if (defaultDsv) {
        const dsvo = await manager.findOne(DataSourceVersionOptions, {
          where: { dataSourceVersionId: defaultDsv.id, environmentId: envId },
        });
        if (dsvo) {
          const result = {
            id: dsvo.id,
            options: dsvo.options,
            environmentId: envId,
            dataSourceId,
            createdAt: dsvo.createdAt,
            updatedAt: dsvo.updatedAt,
            environmentName: envName,
          } as any;
          return result;
        }
      }

      throw new ForbiddenException(
        `No data source version options found for dataSourceId=${dataSourceId}, environmentId=${envId}`
      );
    });
  }

  async init(
    editorVersion: Partial<AppVersion>,
    organizationId: string,
    isMultiEnvironmentEnabled = false,
    manager?: EntityManager
  ): Promise<IAppEnvironmentResponse> {
    const environments: AppEnvironment[] = await this.getAll(organizationId, editorVersion.appId, manager);
    let editorEnvironment: AppEnvironment;
    if (!isMultiEnvironmentEnabled) {
      editorEnvironment = environments.find((env) => env.priority === 1);
    } else {
      editorEnvironment = environments.find((env) => env.id === editorVersion.currentEnvironmentId);
    }
    const { shouldRenderPromoteButton, shouldRenderReleaseButton } = await this.calculateButtonVisibility(
      isMultiEnvironmentEnabled,
      editorEnvironment,
      editorVersion.appId,
      editorVersion.id,
      manager
    );
    const response: IAppEnvironmentResponse = {
      editorVersion,
      editorEnvironment,
      appVersionEnvironment: editorEnvironment,
      shouldRenderPromoteButton,
      shouldRenderReleaseButton,
      environments,
    };
    return response;
  }
}
