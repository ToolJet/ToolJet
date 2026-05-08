import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { APP_RESOURCE_ACTIONS } from 'src/constants/global.constant';
import { isSuperAdmin } from '@helpers/utils.helper';
import { MODULES } from '@modules/app/constants/modules';
import { skipAppEditingVersionHydration } from '@modules/apps/subscribers/apps.subscriber';

type Actions = APP_RESOURCE_ACTIONS.VIEW;
type Subjects = InferSubjects<typeof AppVersion | typeof User | typeof App> | 'all';
export type AppsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class AppsAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async appsActions(user: User, id?: string) {
    const { can, build } = new AbilityBuilder<Ability<[Actions | APP_RESOURCE_ACTIONS, Subjects]>>(
      Ability as AbilityClass<AppsAbility>
    );

    const superAdmin = isSuperAdmin(user);
    // Same opt-out as AbilityFactory.createAbility — apps loaded for permission compute
    // don't need editingVersion hydrated.
    const userPermission = await skipAppEditingVersionHydration.run(true, () =>
      this.abilityService.resourceActionsPermission(user, {
        organizationId: user.organizationId,
        ...(id && { resources: [{ resource: MODULES.APP, resourceId: id }] }),
      })
    );

    const userAppPermissions = userPermission?.[MODULES.APP];
    const appUpdateAllowed = userAppPermissions
      ? userAppPermissions.isAllEditable || userAppPermissions.editableAppsId.includes(id)
      : false;
    const appViewAllowed = userAppPermissions
      ? appUpdateAllowed || userAppPermissions.isAllViewable || userAppPermissions.viewableAppsId.includes(id)
      : false;

    if (appViewAllowed || superAdmin) {
      can(APP_RESOURCE_ACTIONS.VIEW, App);
    }

    can(APP_RESOURCE_ACTIONS.VIEW, App, { isPublic: true });

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
