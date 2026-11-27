import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { MODULES } from '@modules/app/constants/modules';
import { AppEnvironment } from '@entities/app_environments.entity';
import { User } from '@entities/user.entity';
import { DataSource } from 'typeorm';
import { FeatureAbilityFactory as AppAbilityFactory } from '@modules/apps/ability';
import { APP_TYPES, FEATURE_KEY as APP_FEATURE } from '@modules/apps/constants';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { FeatureAbilityFactory as VersionAbilityFactory } from '../ability';
import { FEATURE_KEY } from '../constants';

const resourceTypes = {
  [APP_TYPES.FRONT_END]: MODULES.APP,
  [APP_TYPES.MODULE]: MODULES.MODULES,
  [APP_TYPES.WORKFLOW]: MODULES.WORKFLOWS,
};

@Injectable()
export class ReleasePreflightService {
  constructor(
    private readonly appAbilities: AppAbilityFactory,
    private readonly versionAbilities: VersionAbilityFactory,
    private readonly license: LicenseTermsService,
    private readonly database: DataSource
  ) {}

  async check(app: App, version: AppVersion, request: { user: User }) {
    const resource = [{ resourceType: resourceTypes[app.type] }];
    const release = await this.appAbilities.createAbility(
      request.user,
      { moduleName: MODULES.APP, features: [APP_FEATURE.RELEASE] },
      resource,
      request
    );
    if (!release.can(APP_FEATURE.RELEASE, App, app.id)) {
      throw new ForbiddenException('You do not have permission to release this app.');
    }

    const multiEnvironment = await this.license.getLicenseTerms(LICENSE_FIELD.MULTI_ENVIRONMENT, app.organizationId);
    const environments = await this.database.manager.find(AppEnvironment, {
      where: { organizationId: app.organizationId },
      order: { priority: 'ASC' },
    });
    const current = environments.find((env) => env.id === version.currentEnvironmentId);
    if (!current) throw new BadRequestException('Cannot determine the current environment for this version.');
    const target = multiEnvironment ? environments.find((env) => env.isDefault) : current;
    if (!target || target.priority < current.priority) {
      throw new BadRequestException('Cannot determine the promotion path to production.');
    }
    const path = environments.filter((env) => env.priority >= current.priority && env.priority <= target.priority);
    if (path.slice(1).some((env) => !env.enabled)) {
      throw new BadRequestException('The release path includes a disabled environment.');
    }

    const permissions = await this.versionAbilities.createAbility(
      request.user,
      {
        moduleName: MODULES.VERSION,
        features: [FEATURE_KEY.APP_VERSION_UPDATE, FEATURE_KEY.PROMOTE],
      },
      resource,
      request
    );
    if (version.status === AppVersionStatus.DRAFT && !permissions.can(FEATURE_KEY.APP_VERSION_UPDATE, App, app.id)) {
      throw new ForbiddenException('You do not have permission to save this draft.');
    }
    if (path.length > 1 && !permissions.can(FEATURE_KEY.PROMOTE, App, app.id)) {
      throw new ForbiddenException('You do not have permission to promote this version to production.');
    }
    if (path.length > 1 && !(await this.license.getLicenseTerms(LICENSE_FIELD.VALID, app.organizationId))) {
      throw new ForbiddenException('A valid workspace license is required to promote this version.');
    }
    return {
      version_id: version.id,
      environment_path: path.map(({ id, name }) => ({ id, name })),
    };
  }
}
