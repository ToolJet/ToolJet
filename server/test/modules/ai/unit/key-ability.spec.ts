/** @group platform */
import { FeatureAbilityFactory, AiAbility } from '@modules/ai/ability';
import { FEATURE_KEY } from '@modules/ai/constants';
import { AiConversation } from '@entities/ai_conversation.entity';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { buildAbilityViaFactory, expectFeatures } from 'test-helper';

const originalEdition = process.env.TOOLJET_EDITION;
afterAll(() => {
  process.env.TOOLJET_EDITION = originalEdition;
});

const factory = new FeatureAbilityFactory(null as any);
const build = (permissions: object) => buildAbilityViaFactory<AiAbility>(factory, permissions);
const KEY_FEATURES = [FEATURE_KEY.UPDATE_KEY, FEATURE_KEY.GET_KEY_SETTINGS];

describe('ai FeatureAbilityFactory — instance AI key', () => {
  describe.each([TOOLJET_EDITIONS.EE, TOOLJET_EDITIONS.CE])('on %s (key is instance-wide)', (edition) => {
    beforeEach(() => (process.env.TOOLJET_EDITION = edition));

    it('denies a workspace admin who is not a super admin', async () => {
      expectFeatures(await build({ isAdmin: true }), AiConversation, { denied: KEY_FEATURES });
    });

    it('allows a super admin', async () => {
      expectFeatures(await build({ superAdmin: true }), AiConversation, { allowed: KEY_FEATURES });
    });
  });

  describe('on cloud (key is per workspace)', () => {
    beforeEach(() => (process.env.TOOLJET_EDITION = TOOLJET_EDITIONS.Cloud));

    it('allows a workspace admin', async () => {
      expectFeatures(await build({ isAdmin: true }), AiConversation, { allowed: KEY_FEATURES });
    });

    it('denies a builder', async () => {
      expectFeatures(await build({ isBuilder: true }), AiConversation, { denied: KEY_FEATURES });
    });
  });
});
