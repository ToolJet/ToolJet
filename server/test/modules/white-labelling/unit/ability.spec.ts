/** @group platform */
import { FeatureAbilityFactory, WhiteLabellingAbility } from '@modules/white-labelling/ability';
import { FEATURE_KEY } from '@modules/white-labelling/constant';
import { WhiteLabelling } from '@entities/white_labelling.entity';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { buildAbilityViaFactory } from 'test-helper';

const originalEdition = process.env.TOOLJET_EDITION;
afterAll(() => {
  process.env.TOOLJET_EDITION = originalEdition;
});

const factory = new FeatureAbilityFactory(null as any);
const build = (permissions: object) => buildAbilityViaFactory<WhiteLabellingAbility>(factory, permissions);
const can = (ability: WhiteLabellingAbility, key: FEATURE_KEY) => ability.can(key, WhiteLabelling);

describe('white-labelling FeatureAbilityFactory', () => {
  describe.each([TOOLJET_EDITIONS.EE, TOOLJET_EDITIONS.CE])('on %s (instance-wide branding row)', (edition) => {
    beforeEach(() => (process.env.TOOLJET_EDITION = edition));

    it('denies the instance-wide UPDATE to a workspace admin who is not a super admin', async () => {
      expect(can(await build({ isAdmin: true }), FEATURE_KEY.UPDATE)).toBe(false);
    });

    it('allows the instance-wide UPDATE to a super admin', async () => {
      expect(can(await build({ superAdmin: true }), FEATURE_KEY.UPDATE)).toBe(true);
    });

    it('still lets a workspace admin update their own workspace branding', async () => {
      expect(can(await build({ isAdmin: true }), FEATURE_KEY.UPDATE_ORGANIZATION_WHITE_LABELS)).toBe(true);
    });

    it('denies workspace branding update to a builder', async () => {
      expect(can(await build({ isBuilder: true }), FEATURE_KEY.UPDATE_ORGANIZATION_WHITE_LABELS)).toBe(false);
    });
  });

  describe('on cloud', () => {
    beforeEach(() => (process.env.TOOLJET_EDITION = TOOLJET_EDITIONS.Cloud));

    it('lets a workspace admin update their own workspace branding', async () => {
      expect(can(await build({ isAdmin: true }), FEATURE_KEY.UPDATE_ORGANIZATION_WHITE_LABELS)).toBe(true);
    });

    it('denies the instance-wide UPDATE to a workspace admin', async () => {
      expect(can(await build({ isAdmin: true }), FEATURE_KEY.UPDATE)).toBe(false);
    });
  });

  it('lets every user read branding', async () => {
    process.env.TOOLJET_EDITION = TOOLJET_EDITIONS.EE;
    const ability = await build({});
    expect(can(ability, FEATURE_KEY.GET)).toBe(true);
    expect(can(ability, FEATURE_KEY.GET_ORGANIZATION_WHITE_LABELS)).toBe(true);
  });
});
