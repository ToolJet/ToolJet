import { Injectable, CanActivate, ExecutionContext, Type, HttpException, ForbiddenException } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AbilityFactory } from '../ability-factory';
import { MODULE_INFO } from '../constants/module-info';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { FeatureConfig, ResourceDetails } from '../types';
import { App } from '@entities/app.entity';
import { Organization } from '@entities/organization.entity';
import { WorkspaceBanList } from '@entities/workspace_ban_list.entity';
import { MODULES } from '../constants/modules';
import { isSuperAdmin } from '@helpers/utils.helper';
import { cloneDeep } from 'lodash';
import { TransactionLogger } from '@modules/logging/service';

// User should be present or app should be public
@Injectable()
export abstract class AbilityGuard implements CanActivate {
  constructor(
    protected reflector: Reflector,
    protected moduleRef: ModuleRef,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly transactionLogger: TransactionLogger,
    protected readonly dataSource: DataSource
  ) {}

  protected abstract getAbilityFactory(): Type<AbilityFactory<any, any>>;
  protected abstract getSubjectType(): any;
  protected forwardAbility(): boolean {
    return false;
  }
  protected resource: any;
  protected getResourceObject(): any {
    return this.resource;
  }
  protected setResourceObject(resource: any): void {
    this.resource = resource;
  }
  protected getResource(): ResourceDetails | ResourceDetails[] {
    return;
  }

  private async checkWorkspaceSuspended(orgId: string): Promise<void> {
    const banned = await this.dataSource.getRepository(WorkspaceBanList).findOne({ where: { organizationId: orgId } });
    if (banned) {
      const org = await this.dataSource
        .getRepository(Organization)
        .findOne({ where: { id: orgId }, select: ['id', 'name'] });
      throw new ForbiddenException({
        message: JSON.stringify({ errorType: 'WORKSPACE_BANNED', workspaceName: org?.name }),
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const startTime = Date.now();
    let error: Error | undefined;

    try {
      const module = cloneDeep(this.reflector.get<MODULES>('tjModuleId', context.getClass()));
      let features = cloneDeep(this.reflector.get<string[]>('tjFeatureId', context.getHandler()));

      if (features && !Array.isArray(features)) {
        features = [features];
      }

      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const app: App = request.tj_app;
      // Guard instances are singleton-scoped in Nest's DI container, so `this.resource`
      // persists across requests. It must always be overwritten (even with undefined) so a
      // request with no app in context can't inherit a stale value set by an earlier request.
      this.setResourceObject(app);

      const reqOrg =
        typeof request.headers['tj-workspace-id'] === 'object'
          ? request.headers['tj-workspace-id'][0]
          : request.headers['tj-workspace-id'];
      const orgId = app?.organizationId || user?.organizationId || reqOrg;

      if (orgId) {
        await this.checkWorkspaceSuspended(orgId);
      }

      if (!features?.length) {
        return false;
      }

      // License check
      for (const feature of features) {
        const featureInfo: FeatureConfig = MODULE_INFO?.[module]?.[feature];
        if (!featureInfo) {
          throw new HttpException(`Feature ${feature} not found in module ${module}`, 404);
        }

        const licenseRequired: LICENSE_FIELD = featureInfo?.license;
        if (licenseRequired && featureInfo.isPublic && !(app?.organizationId || user?.organizationId)) {
          // Public feature and organization id not present -> Check instance level license
          if (!(await this.licenseTermsService.getLicenseTermsInstance(licenseRequired))) {
            throw new HttpException(
              `Oops! Your current plan doesn't have access to this feature. Please upgrade your plan now to use this.`,
              451
            );
          }
        }
        if (licenseRequired && !(app?.organizationId || user?.organizationId)) {
          // If no license is required, continue to the next feature
          return true;
        }
        if (
          licenseRequired &&
          !(await this.licenseTermsService.getLicenseTerms(
            licenseRequired,
            app?.organizationId || user?.organizationId
          ))
        ) {
          throw new HttpException(
            `Oops! Your current plan doesn't have access to this feature. Please upgrade your plan now to use this.`,
            451
          );
        }

        // If any of the feature is public
        if (featureInfo.isPublic) {
          // No other validations if user is API is public
          return true;
        }

        if (featureInfo.isSuperAdminFeature && !isSuperAdmin(user)) {
          // If the user is not super admin and the feature is a super admin feature
          throw new ForbiddenException({
            message: 'You do not have permission to access this resource',
            organizationId: app?.organizationId,
          });
        }

        if (app?.isPublic && !featureInfo.shouldNotSkipPublicApp) {
          // No need to do validations if app is public
          return true;
        }

        if (app?.isPublic && featureInfo.shouldNotSkipPublicApp && !user) {
          // App is public and feature should not skip public app check and user is not available
          return false;
        }
      }

      if (!user && !app?.isPublic) {
        return false;
      }

      const resources = this.getResource();
      const resourceArray: ResourceDetails[] = Array.isArray(resources) ? resources : resources ? [resources] : [];

      if (user) {
        const abilityFactory = await this.moduleRef.resolve(this.getAbilityFactory());

        // ABILITY DB CALL HAPPENS HERE
        const ability = await abilityFactory.createAbility(
          user,
          { moduleName: module, features },
          resourceArray,
          request
        );

        if (this.forwardAbility()) {
          request.tj_ability = ability;
        }

        const resourceId = request.tj_resource_id;

        // Validate all features against resource if any
        const forbiddenFeature = features.find(
          (feature: string) => !ability.can(feature, this.getSubjectType(), resourceId || undefined)
        );

        if (forbiddenFeature) {
          const errorMessage = this.getForbiddenMessage(forbiddenFeature, resourceId);
          throw new ForbiddenException({
            message: errorMessage || 'You do not have permission to access this resource',
            organizationId: app?.organizationId,
          });
        }
        return true;
      }
      if (!app || !app?.isPublic) {
        // If user is not available the app object should be there and app should be public
        return false;
      }
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const executionTime = Date.now() - startTime;
      if (error) {
        this.transactionLogger.log(
          `[AbilityGuard] canActivate execution time: ${executionTime}ms - Exception: ${error.message}`
        );
      } else {
        this.transactionLogger.log(`[AbilityGuard] canActivate execution time: ${executionTime}ms - Result: Success`);
      }
    }
  }

  protected getForbiddenMessage(feature: string, resourceId): string {
    const messageGroups: { message: string; features: string[] }[] = [
      {
        message: 'You do not have access to perform this action',
        features: ['CREATE_FOLDER_APP', 'DELETE_FOLDER_APP', 'DELETE_FOLDER'],
      },
      // Add more message groups here later
    ];

    const match = messageGroups.find((group) => group.features.includes(feature));

    return match?.message;
  }
}
