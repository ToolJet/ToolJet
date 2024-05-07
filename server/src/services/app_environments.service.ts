import { Injectable } from '@nestjs/common';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { EntityManager, UpdateResult, FindOneOptions, In, DeleteResult } from 'typeorm';
import { dbTransactionWrap, defaultAppEnvironments } from 'src/helpers/utils.helper';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { OrgEnvironmentConstantValue } from 'src/entities/org_environment_constant_values.entity';
import { OrganizationConstant } from 'src/entities/organization_constants.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { LicenseService } from './license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
import { AppEnvironmentActionParametersDto } from '@dto/environment_action_parameters.dto';
import { App } from 'src/entities/app.entity';

export interface ExtendedEnvironment extends AppEnvironment {
  appVersionsCount?: number;
}

export interface AppEnvironmentResponse {
  editorVersion: Partial<AppVersion>;
  editorEnvironment: AppEnvironment;
  appVersionEnvironment: AppEnvironment;
  shouldRenderPromoteButton: boolean;
  shouldRenderReleaseButton: boolean;
  environments: ExtendedEnvironment[];
}

export enum AppEnvironmentActions {
  VERSION_DELETED = 'version_deleted',
  ENVIROMENT_CHANGED = 'environment_changed',
}
@Injectable()
export class AppEnvironmentService {
  constructor(private licenseService: LicenseService) {}
  async init(
    editingVersionId: string,
    organizationId: string,
    manager?: EntityManager
  ): Promise<AppEnvironmentResponse> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const editorVersion = await manager.findOne(AppVersion, {
        select: ['id', 'name', 'currentEnvironmentId', 'appId'],
        where: { id: editingVersionId },
      });
      const environments: ExtendedEnvironment[] = await this.getAll(organizationId, manager, editorVersion.appId);
      const isMultiEnvironmentEnabled = await this.licenseService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT);
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
      const response: AppEnvironmentResponse = {
        editorVersion,
        editorEnvironment,
        appVersionEnvironment: editorEnvironment,
        shouldRenderPromoteButton,
        shouldRenderReleaseButton,
        environments,
      };
      return response;
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
    const isVersionReleased = appDetails.currentVersionId === versionId;
    const isCurrentVersionInProduction = appVersionEnvironment?.isDefault;
    const shouldRenderPromoteButton = !isCurrentVersionInProduction && !isVersionReleased;
    const shouldRenderReleaseButton = isCurrentVersionInProduction || isVersionReleased;
    return { shouldRenderPromoteButton, shouldRenderReleaseButton };
  }

  async getSelectedVersion(selectedEnvironmentId: string, appId: string, manager?: EntityManager): Promise<any> {
    const newVersionQuery = `
    SELECT name, id, current_environment_id
    FROM app_versions
    WHERE current_environment_id IN (
        SELECT id
        FROM app_environments
        WHERE priority >= (
            SELECT priority
            FROM app_environments
            WHERE id = $1
        )
    )
    AND app_id = $2
    ORDER BY updated_at DESC
    LIMIT 1;
    `;
    const result = await manager.query(newVersionQuery, [selectedEnvironmentId, appId]);
    return result[0];
  }

  async processActions(organizationId: string, action: string, actionParameters: AppEnvironmentActionParametersDto) {
    const { editorEnvironmentId, deletedVersionId, editorVersionId, appId } = actionParameters;
    const isMultiEnvironmentEnabled = await this.licenseService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      switch (action) {
        case AppEnvironmentActions.VERSION_DELETED: {
          const appEnvironmentResponse: Partial<AppEnvironmentResponse> = {};
          const isUserDeletedTheCurrentVersion = editorVersionId === deletedVersionId;
          /* 
            This is post action which is triggered when a version is deleted from the app version manager. 
          */

          const multiEnvironmentsNotAvailable = !editorEnvironmentId;
          if (multiEnvironmentsNotAvailable) {
            const { shouldRenderPromoteButton, shouldRenderReleaseButton } = await this.calculateButtonVisibility(
              false
            );
            appEnvironmentResponse.shouldRenderPromoteButton = shouldRenderPromoteButton;
            appEnvironmentResponse.shouldRenderReleaseButton = shouldRenderReleaseButton;
            if (isUserDeletedTheCurrentVersion) {
              const newVersionQuery = `
              SELECT name, id, current_environment_id
              FROM app_versions
              WHERE app_id = $1
              ORDER BY updated_at DESC
              LIMIT 1;
              `;
              const selectedVersionQueryResponse = await manager.query(newVersionQuery, [appId]);
              const selectedVersion = selectedVersionQueryResponse[0];
              const selectedEnvironment = await manager.findOneOrFail(AppEnvironment, {
                where: { id: selectedVersion.current_environment_id },
              });
              appEnvironmentResponse.editorEnvironment = selectedEnvironment;
              appEnvironmentResponse.editorVersion = selectedVersion;
              appEnvironmentResponse.appVersionEnvironment = selectedEnvironment;
            }
            return appEnvironmentResponse;
          }

          const environments: ExtendedEnvironment[] = await this.getAll(organizationId, manager, appId);
          const versionsCountOfEnvironment = environments.find(
            (env) => env.id === editorEnvironmentId
          ).appVersionsCount;
          appEnvironmentResponse.environments = environments;

          const environmentDoensNotHaveVersions = versionsCountOfEnvironment === 0;
          if (environmentDoensNotHaveVersions) {
            /* Send back new editor environment and version */
            const newEnvironmentQuery = `
            SELECT ae.*
            FROM app_environments ae
            JOIN app_versions av ON ae.id = av.current_environment_id AND av.app_id = $2
            WHERE ae.priority < (
                    SELECT priority
                    FROM app_environments
                    WHERE id = $1
                )
            GROUP BY ae.id
            ORDER BY ae.priority DESC
            LIMIT 1;
            `;
            const selectedEnvironmentResponse = await manager.query(newEnvironmentQuery, [editorEnvironmentId, appId]);
            const selectedEnvironment = selectedEnvironmentResponse[0];
            const selectedVersion = await this.getSelectedVersion(selectedEnvironment.id, appId, manager);
            appEnvironmentResponse.editorEnvironment = selectedEnvironment;
            appEnvironmentResponse.editorVersion = selectedVersion;
            appEnvironmentResponse.appVersionEnvironment = environments.find(
              (env) => env.id === selectedVersion.current_environment_id
            );
            /* Add extra things to respons */
          } else if (isUserDeletedTheCurrentVersion) {
            const selectedEnvironment = await manager.findOneOrFail(AppEnvironment, {
              id: editorEnvironmentId,
            });
            /* User deleted current editor version. Client needs new editor version */
            if (selectedEnvironment) {
              const selectedVersion = await this.getSelectedVersion(editorEnvironmentId, appId, manager);
              const appVersionEnvironment = await manager.findOneOrFail(AppEnvironment, {
                where: { id: selectedVersion.current_environment_id },
              });
              appEnvironmentResponse.editorVersion = selectedVersion;
              appEnvironmentResponse.editorEnvironment = selectedEnvironment;
              appEnvironmentResponse.appVersionEnvironment = appVersionEnvironment;
            }
          }
          return appEnvironmentResponse;
        }
        case AppEnvironmentActions.ENVIROMENT_CHANGED: {
          const appEnvironmentResponse: Partial<AppEnvironmentResponse> = {};
          const selectedVersion = await this.getSelectedVersion(editorEnvironmentId, appId, manager);
          appEnvironmentResponse.editorVersion = await this.getSelectedVersion(editorEnvironmentId, appId, manager);
          const appVersionEnvironment = await manager.findOneOrFail(AppEnvironment, {
            where: { id: selectedVersion.current_environment_id },
          });
          const { shouldRenderPromoteButton, shouldRenderReleaseButton } = await this.calculateButtonVisibility(
            isMultiEnvironmentEnabled,
            appVersionEnvironment,
            appId,
            selectedVersion.id,
            manager
          );
          appEnvironmentResponse.shouldRenderPromoteButton = shouldRenderPromoteButton;
          appEnvironmentResponse.shouldRenderReleaseButton = shouldRenderReleaseButton;
          return appEnvironmentResponse;
        }
        default:
          break;
      }
    });
  }

  async get(
    organizationId: string,
    id?: string,
    priorityCheck = false,
    manager?: EntityManager,
    licenseCheck = false
  ): Promise<AppEnvironment> {
    const isMultiEnvironmentEnabled = licenseCheck
      ? await this.licenseService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT)
      : false;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const condition: FindOneOptions<AppEnvironment> = {
        where: {
          organizationId,
          ...(id
            ? { id }
            : licenseCheck && !isMultiEnvironmentEnabled
            ? { priority: 1 }
            : !priorityCheck
            ? { isDefault: true }
            : {}),
        },
        ...(priorityCheck && { order: { priority: 'ASC' } }),
      };
      return await manager.findOneOrFail(AppEnvironment, condition);
    }, manager);
  }

  getByPriority(organizationId: string, ASC = true, manager?: EntityManager): Promise<AppEnvironment> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const condition: FindOneOptions<AppEnvironment> = {
        where: {
          organizationId,
        },
        order: { priority: ASC ? 'ASC' : 'DESC' },
      };
      return manager.findOneOrFail(AppEnvironment, condition);
    }, manager);
  }

  async getOptions(dataSourceId: string, organizationId: string, environmentId?: string): Promise<DataSourceOptions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let envId: string = environmentId;
      if (!environmentId) {
        envId = (await this.get(organizationId, null, false, manager, true))?.id;
      }
      return await manager.findOneOrFail(DataSourceOptions, {
        where: { environmentId: envId, dataSourceId },
      });
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

  async update(id: string, name: string, organizationId: string, manager?: EntityManager): Promise<UpdateResult> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.update(AppEnvironment, { id, organizationId }, { name });
    }, manager);
  }

  async getAll(organizationId: string, manager?: EntityManager, appId?: string): Promise<ExtendedEnvironment[]> {
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

          appEnvironment['appVersionsCount'] = count;
        }
      }

      const multiEnvironmentEnabled = await this.licenseService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT);
      for (const appEnvironment of appEnvironments) {
        appEnvironment.priority !== 1 && !multiEnvironmentEnabled
          ? (appEnvironment['enabled'] = false)
          : (appEnvironment['enabled'] = true);
      }

      return appEnvironments;
    }, manager);
  }

  async getVersionsByEnvironment(
    organizationId: string,
    appId: string,
    currentEnvironmentId?: string,
    manager?: EntityManager
  ) {
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
        select: ['id', 'name', 'appId'],
      });
    }, manager);
  }

  async delete(id: string, organizationId: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const env = await manager.findOne(AppEnvironment, {
        where: {
          id,
          organizationId,
        },
      });

      if (env.isDefault) {
        throw Error("Can't delete the default environment");
      }

      return await manager.delete(AppEnvironment, { where: { id, organizationId } });
    });
  }

  async getVersion(id: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOneOrFail(AppVersion, { id });
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

  async getEnvironmentByName(name: string, organizationId: string, manager?: EntityManager): Promise<AppEnvironment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return manager.findOne(AppEnvironment, {
        where: { name, organizationId },
      });
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
        envId = (await this.get(organizationId, environmentId, false, manager, true)).id;
      }

      const constantId = (
        await manager.findOne(OrganizationConstant, {
          where: { constantName, organizationId },
        })
      ).id;

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

      const environmentValues = constantToDelete.orgEnvironmentConstantValues.filter(
        (value) => value.environmentId !== environmentId
      );

      const emptyValues = environmentValues.filter((value) => value.value === '');

      if (
        constantToDelete.orgEnvironmentConstantValues.length === 1 ||
        emptyValues.length === environmentValues.length
      ) {
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
