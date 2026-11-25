import { AiConversation } from '@entities/ai_conversation.entity';
import * as utils from '@helpers/utils.helper';
import { AiAbility, FeatureAbilityFactory } from '@modules/ai/ability';
import { FEATURE_KEY } from '@modules/ai/constants';
import { buildAbilityViaFactory, expectFeatures } from 'test-helper';

describe('AI key settings permissions', () => {
  const factory = new FeatureAbilityFactory(null);
  const keySettings = [FEATURE_KEY.GET_KEY_SETTINGS, FEATURE_KEY.UPDATE_KEY];

  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['ee', false],
    ['cloud', true],
    ['ce', true],
  ] as const)('applies the %s key settings scope to workspace admins', async (edition, canConfigure) => {
    jest.spyOn(utils, 'getTooljetEdition').mockReturnValue(edition);
    const ability = await buildAbilityViaFactory<AiAbility>(factory, { isAdmin: true });
    expectFeatures(ability, AiConversation, canConfigure ? { allowed: keySettings } : { denied: keySettings });
  });

  it('allows an instance super admin to configure credentials and a builder to send messages', async () => {
    jest.spyOn(utils, 'getTooljetEdition').mockReturnValue('ee');
    const admin = await buildAbilityViaFactory<AiAbility>(factory, { superAdmin: true });
    const builder = await buildAbilityViaFactory<AiAbility>(factory, { isBuilder: true });
    expectFeatures(admin, AiConversation, { allowed: keySettings });
    expectFeatures(builder, AiConversation, { allowed: [FEATURE_KEY.SEND_USER_MESSAGE], denied: keySettings });
  });
});
