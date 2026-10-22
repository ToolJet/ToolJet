import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { APP_RESOURCE_ACTIONS } from 'src/constants/global.constant';
import { isSuperAdmin } from '@helpers/utils.helper';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

type Actions = APP_RESOURCE_ACTIONS.VIEW;
type Subjects = InferSubjects<typeof AppVersion | typeof User | typeof App> | 'all';
export type AppsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class AppsAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async appsActions(user: User, id?: string, appType: APP_TYPES = APP_TYPES.FRONT_END) {
    const { can, build } = new AbilityBuilder<Ability<[Actions | APP_RESOURCE_ACTIONS, Subjects]>>(
      Ability as AbilityClass<AppsAbility>
    );

    const superAdmin = isSuperAdmin(user);
    const resource = appType === APP_TYPES.MODULE ? MODULES.MODULES : MODULES.APP;
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
      ...(id && { resources: [{ resource, resourceId: id }] }),
    });

    const userAppPermissions = userPermission?.[resource];
    const appUpdateAllowed = userAppPermissions
      ? userAppPermissions.isAllEditable || userAppPermissions.editableAppsId.includes(id)
      : false;
    const appViewAllowed = userAppPermissions
      ? appUpdateAllowed || userAppPermissions.isAllViewable || userAppPermissions.viewableAppsId.includes(id)
      : false;

    // Match the module viewer's existing role policy: end users can run modules
    // inside apps; non-admin builders need the module's Edit or Build-with grant.
    const moduleViewer = appType === APP_TYPES.MODULE && (userPermission?.isAdmin || userPermission?.isEndUser);
    if (appViewAllowed || superAdmin || moduleViewer) {
      can(APP_RESOURCE_ACTIONS.VIEW, App);
    }

    can(APP_RESOURCE_ACTIONS.VIEW, App, { isPublic: true });

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
  /** Workflows have their own granular permission namespace, separate from front-end apps. */
  async workflowActions(user: User, id: string) {
    const { can, build } = new AbilityBuilder<AppsAbility>(Ability as AbilityClass<AppsAbility>);
    const permissions = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId, resources: [{ resource: MODULES.WORKFLOWS, resourceId: id }],
    });
    const workflows = permissions?.[MODULES.WORKFLOWS];
    if (isSuperAdmin(user) || permissions?.isAdmin || workflows?.isAllEditable || workflows?.isAllExecutable ||
        workflows?.editableWorkflowsId?.includes(id) || workflows?.executableWorkflowsId?.includes(id)) {
      can(APP_RESOURCE_ACTIONS.VIEW, App);
    }
    return build({ detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects> });
  }

}
