/** @group security */
import { ForbiddenException } from '@nestjs/common';
import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';
import { FeatureAbilityGuard } from '@modules/versions/ability/guard';
import { FeatureAbility } from '@modules/versions/ability/index';
import { defineAppVersionAbility } from '@modules/versions/ability/app-version.ability';
import { FEATURE_KEY } from '@modules/versions/constants';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { DEFAULT_USER_PERMISSIONS, DEFAULT_USER_APPS_PERMISSIONS } from '@modules/ability/constants';

/*
  Promote, and its missing-tables read, share FEATURE_KEY.PROMOTE. A public app used to skip the ability check for it,
  so any signed-in member of the workspace passed the guard. Now the check runs on public apps too.
*/

const APP_ID = '33333333-3333-4333-8333-333333333333';
const ORG = '11111111-1111-4111-8111-111111111111';

type Who = { isAdmin?: boolean; appPromote?: boolean; editable?: string[]; viewable?: string[] };

const permissionsFor = ({ isAdmin = false, appPromote = false, editable = [], viewable = [] }: Who) => ({
  superAdmin: false,
  isAdmin,
  isBuilder: !isAdmin && (appPromote || editable.length > 0),
  isEndUser: !isAdmin && !appPromote && !editable.length,
  user: {},
  resource: [{ resourceType: MODULES.APP }],
  userPermission: {
    ...DEFAULT_USER_PERMISSIONS,
    appPromote,
    [MODULES.APP]: { ...DEFAULT_USER_APPS_PERMISSIONS, editableAppsId: editable, viewableAppsId: viewable },
  },
});

const guardFor = (who: Who) => {
  const factory = {
    createAbility: async () => {
      const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as AbilityClass<FeatureAbility>);
      defineAppVersionAbility(can, permissionsFor(who) as any, APP_ID);
      return build();
    },
  };
  return new FeatureAbilityGuard(
    { get: (key: string) => (key === 'tjModuleId' ? MODULES.VERSION : [FEATURE_KEY.PROMOTE]) } as any,
    { resolve: async () => factory } as any,
    { getLicenseTerms: async () => true, getLicenseTermsInstance: async () => true } as any,
    { log: () => undefined } as any,
    { getRepository: () => ({ findOne: async () => null }) } as any
  );
};

const contextFor = (isPublic: boolean, user: any = { id: 'user-1', organizationId: ORG }) =>
  ({
    getClass: () => class {},
    getHandler: () => () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        headers: {},
        tj_resource_id: APP_ID,
        tj_app: { id: APP_ID, organizationId: ORG, isPublic, type: APP_TYPES.FRONT_END },
      }),
    }),
  }) as any;

describe('FeatureAbilityGuard', () => {
  describe('PUT /apps/:id/versions/:versionId/promote and GET .../promote/missing-tables | PROMOTE', () => {
    it('should refuse a member who can only view the app, on a public app', async () => {
      await expect(guardFor({ viewable: [APP_ID] }).canActivate(contextFor(true))).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it('should refuse a member with no access to the app at all, on a public app', async () => {
      await expect(guardFor({}).canActivate(contextFor(true))).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should refuse an editor without the promote permission, as on a private app', async () => {
      await expect(guardFor({ editable: [APP_ID] }).canActivate(contextFor(true))).rejects.toBeInstanceOf(
        ForbiddenException
      );
      await expect(guardFor({ editable: [APP_ID] }).canActivate(contextFor(false))).rejects.toBeInstanceOf(
        ForbiddenException
      );
    });

    it('should let an editor with the promote permission promote, public or not', async () => {
      const editor = { editable: [APP_ID], appPromote: true };
      await expect(guardFor(editor).canActivate(contextFor(true))).resolves.toBe(true);
      await expect(guardFor(editor).canActivate(contextFor(false))).resolves.toBe(true);
    });

    it('should let an admin promote, public or not', async () => {
      await expect(guardFor({ isAdmin: true }).canActivate(contextFor(true))).resolves.toBe(true);
      await expect(guardFor({ isAdmin: true }).canActivate(contextFor(false))).resolves.toBe(true);
    });

    it('should refuse a caller with no session on a public app', async () => {
      await expect(guardFor({ isAdmin: true }).canActivate(contextFor(true, null))).resolves.toBe(false);
    });
  });
});
