/** @group working */
import { AiUtilService } from '@ee/ai/util.service';
import { fetch } from 'undici';

jest.mock('undici', () => ({ ...jest.requireActual('undici'), fetch: jest.fn() }));

describe('OpenRouter model catalogue', () => {
  afterEach(() => jest.clearAllMocks());

  it('retains compatible text and vision models with authoritative input capabilities', async () => {
    const model = (id, input, context = 240000, params = ['tools', 'response_format', 'structured_outputs']) => ({
      id,
      name: id,
      context_length: context,
      supported_parameters: params,
      architecture: { input_modalities: input },
    });
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          model('fixture/vision', ['text', 'image']),
          model('fixture/text', ['text']),
          model('fixture/unknown', undefined),
          model('fixture/short', ['text', 'image'], 32000),
          model('fixture/no-tools', ['text', 'image'], 240000, ['response_format', 'structured_outputs']),
        ],
      }),
    });
    const service = Object.create(AiUtilService.prototype);
    expect(await service.listCompatibleOpenRouterModels()).toEqual([
      { id: 'fixture/text', name: 'fixture/text', contextWindow: 240000, inputModalities: ['text'] },
      { id: 'fixture/unknown', name: 'fixture/unknown', contextWindow: 240000, inputModalities: [] },
      { id: 'fixture/vision', name: 'fixture/vision', contextWindow: 240000, inputModalities: ['text', 'image'] },
    ]);
  });
});
