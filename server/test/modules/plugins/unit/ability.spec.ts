/** @group platform */
import { FeatureAbilityFactory, FeatureAbility } from '@modules/plugins/ability';
import { FEATURE_KEY } from '@modules/plugins/constants';
import { Plugin } from '@entities/plugin.entity';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { buildAbilityViaFactory, expectFeatures } from 'test-helper';

const originalEdition = process.env.TOOLJET_EDITION;
afterAll(() => {
  process.env.TOOLJET_EDITION = originalEdition;
});

const factory = new FeatureAbilityFactory(null as any);
const build = (permissions: object) => buildAbilityViaFactory<FeatureAbility>(factory, permissions);
// Plugin rows are instance-wide, so these change what every workspace sees.
const INSTANCE_WIDE = [FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE, FEATURE_KEY.UNINSTALL_PLUGINS, FEATURE_KEY.RELOAD];

describe.each([TOOLJET_EDITIONS.EE, TOOLJET_EDITIONS.CE, TOOLJET_EDITIONS.Cloud])(
  'plugins FeatureAbilityFactory on %s',
  (edition) => {
    beforeEach(() => (process.env.TOOLJET_EDITION = edition));

    it('denies instance-wide actions to a workspace admin who is not a super admin', async () => {
      expectFeatures(await build({ isAdmin: true }), Plugin, { denied: INSTANCE_WIDE });
    });

    it('denies instance-wide actions to a builder and an end user', async () => {
      expectFeatures(await build({ isBuilder: true }), Plugin, { denied: INSTANCE_WIDE });
      expectFeatures(await build({}), Plugin, { denied: INSTANCE_WIDE });
    });

    it('allows instance-wide actions to a super admin', async () => {
      expectFeatures(await build({ superAdmin: true }), Plugin, { allowed: INSTANCE_WIDE });
    });

    it('still lets builders install plugins and everyone read them', async () => {
      const ability = await build({ isBuilder: true });
      expectFeatures(ability, Plugin, { allowed: [FEATURE_KEY.INSTALL, FEATURE_KEY.GET, FEATURE_KEY.GET_ONE] });
    });
  }
);
