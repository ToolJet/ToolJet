import { Injectable, CanActivate, ExecutionContext, Type, HttpException, ForbiddenException } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AbilityFactory } from '../ability-factory';
import { MODULE_INFO } from '../constants/module-info';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { FeatureConfig, ResourceDetails } from '../types';
import { App } from '@entities/app.entity';
import { MODULES } from '../constants/modules';
import { isSuperAdmin } from '@helpers/utils.helper';
import { cloneDeep } from 'lodash';

// User should be present or app should be public
@Injectable()
export abstract class AbilityGuard implements CanActivate {
  constructor(
    protected reflector: Reflector,
    protected moduleRef: ModuleRef,
    protected readonly licenseTermsService: LicenseTermsService
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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const module = cloneDeep(this.reflector.get<MODULES>('tjModuleId', context.getClass()));
    let features = cloneDeep(this.reflector.get<string[]>('tjFeatureId', context.getHandler()));

    if (features && !Array.isArray(features)) {
      features = [features];
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const app: App = request.tj_app;
    if (app) {
      this.setResourceObject(app);
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
      if (licenseRequired && !(app?.organizationId || user?.organizationId)) {
        // If no license is required, continue to the next feature
        return true;
      }
      if (
        licenseRequired &&
        !(await this.licenseTermsService.getLicenseTerms(licenseRequired, app?.organizationId || user?.organizationId))
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
      if (!features.every((feature) => ability.can(feature, this.getSubjectType(), resourceId || undefined))) {
        throw new ForbiddenException({
          message: 'You do not have permission to access this resource',
          organizationId: app?.organizationId,
        });
      }
      return true;
    }
    if (!app || !app?.isPublic) {
      // If user is not available the app object should be there and app should be public
      return false;
    }
  }
}
