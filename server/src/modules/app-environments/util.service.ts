import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager, FindOptionsOrderValue } from 'typeorm';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { IAppEnvironmentUtilService } from './interfaces/IUtilService';
import { AppVersion } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';
import { FindOneOptions } from 'typeorm';
import { defaultAppEnvironments } from '@helpers/utils.helper';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { IAppEnvironmentResponse } from './interfaces/IAppEnvironmentResponse';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { DataSourceVersionOptions } from '@entities/data_source_version_options.entity';

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
      currentEnvironmentId: result.appVersion_current_environment_id,
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

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const condition: FindOneOptions<AppEnvironment> = {
        where: {
          organizationId,
          ...(id ? { id } : !isMultiEnvironmentEnabled ? { priority: 1 } : !priorityCheck ? { isDefault: true } : {}),
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

  async getOptions(
    dataSourceId: string,
    organizationId: string,
    environmentId?: string,
    branchId?: string,
    appVersionId?: string
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

      // Saved/tagged version path: read from data_source_version_options via appVersionId
      if (appVersionId) {
        const dsv = await manager.findOne(DataSourceVersion, {
          where: { dataSourceId, appVersionId, isActive: true },
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
