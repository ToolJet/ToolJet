import { Injectable } from '@nestjs/common';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { EntityManager, FindOneOptions, In } from 'typeorm';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppEnvironmentActions } from './constants';
import { IAppEnvironmentService } from './interfaces/IService';
import { AppEnvironmentActionParametersDto } from './dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { IAppEnvironmentResponse } from './interfaces/IAppEnvironmentResponse';
import { AppEnvironmentUtilService } from './util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';

@Injectable()
export class AppEnvironmentService implements IAppEnvironmentService {
  constructor(
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly licenseTermsService: LicenseTermsService
  ) {}
  async init(editingVersionId: string, organizationId: string): Promise<IAppEnvironmentResponse> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const editorVersion = await manager.findOne(AppVersion, {
        select: ['id', 'name', 'appId'],
        where: { id: editingVersionId },
      });
      return await this.appEnvironmentUtilService.init(editorVersion, organizationId, false, manager);
    });
  }

  async processActions(
    organizationId: string | null,
    action: string,
    actionParameters: AppEnvironmentActionParametersDto
  ) {
    const { editorEnvironmentId, deletedVersionId, editorVersionId, appId } = actionParameters;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      switch (action) {
        case AppEnvironmentActions.VERSION_DELETED: {
          const appEnvironmentResponse: Partial<IAppEnvironmentResponse> = {};
          const isUserDeletedTheCurrentVersion = editorVersionId === deletedVersionId;
          /* 
                This is post action which is triggered when a version is deleted from the app version manager. 
              */

          const multiEnvironmentsNotAvailable = !editorEnvironmentId;
          if (multiEnvironmentsNotAvailable) {
            const { shouldRenderPromoteButton, shouldRenderReleaseButton } =
              await this.appEnvironmentUtilService.calculateButtonVisibility(false);
            appEnvironmentResponse.shouldRenderPromoteButton = shouldRenderPromoteButton;
            appEnvironmentResponse.shouldRenderReleaseButton = shouldRenderReleaseButton;
            if (isUserDeletedTheCurrentVersion) {
              const newVersionQuery = manager
                .createQueryBuilder(AppVersion, 'appVersion')
                .select(['appVersion.name', 'appVersion.id', 'appVersion.currentEnvironmentId'])
                .where('appVersion.appId = :appId', { appId: 'your_app_id' })
                .orderBy('appVersion.updatedAt', 'DESC')
                .limit(1)
                .getQuery();
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

          /* If the editorEnvironment is null then the method will return all the versions of an App */
          const versionsCountOfEnvironment = await manager.count(AppVersion, {
            where: { currentEnvironmentId: editorEnvironmentId, appId },
          });
          const environmentDoensNotHaveVersions = versionsCountOfEnvironment === 0;
          if (environmentDoensNotHaveVersions) {
            /* Send back new editor environment and version */
            const newEnvironmentQuery = manager
              .createQueryBuilder(AppEnvironment, 'env')
              .select('*')
              .where(
                'env.priority < (' +
                  manager
                    .createQueryBuilder(AppEnvironment, 'innerEnv')
                    .select('innerEnv.priority')
                    .where('innerEnv.id = :id', { id: 'your_environment_id' })
                    .getQuery() +
                  ')'
              )
              .orderBy('env.priority', 'DESC')
              .limit(1)
              .getQuery();

            const selectedEnvironmentResponse = await manager.query(newEnvironmentQuery, [editorEnvironmentId]);
            const selectedEnvironment = selectedEnvironmentResponse[0];
            const selectedVersion = await this.appEnvironmentUtilService.getSelectedVersion(
              selectedEnvironment.id,
              appId,
              manager
            );
            appEnvironmentResponse.editorEnvironment = selectedEnvironment;
            appEnvironmentResponse.editorVersion = selectedVersion;
            /* Add extra things to respons */
          } else if (isUserDeletedTheCurrentVersion) {
            const selectedEnvironment = await manager.findOneOrFail(AppEnvironment, {
              where: { id: editorEnvironmentId },
            });
            /* User deleted current editor version. Client needs new editor version */
            if (selectedEnvironment) {
              const selectedVersion = await this.appEnvironmentUtilService.getSelectedVersion(
                editorEnvironmentId,
                appId,
                manager
              );
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
          const appEnvironmentResponse: Partial<IAppEnvironmentResponse> = {};
          appEnvironmentResponse.editorVersion = await this.appEnvironmentUtilService.getSelectedVersion(
            editorEnvironmentId,
            appId,
            manager
          );
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
    licenseCheck = false,
    manager?: EntityManager
  ): Promise<AppEnvironment> {
    const isMultiEnvironmentEnabled = licenseCheck
      ? await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT)
      : false;

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

  async create(organizationId: string, name: string, isDefault = false, priority: number): Promise<AppEnvironment> {
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
    });
  }

  async update(id: string, name: string, organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getAll(organizationId: string, appId?: string, manager?: EntityManager): Promise<AppEnvironment[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await this.appEnvironmentUtilService.getAll(organizationId, appId, manager);
    }, manager);
  }

  async getVersionsByEnvironment(organizationId: string, appId: string, currentEnvironmentId?: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const conditions = { appId };
      if (currentEnvironmentId) {
        const env = await this.appEnvironmentUtilService.get(organizationId, currentEnvironmentId, false, manager);
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
    });
  }

  async delete(id: string, organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getVersion(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
