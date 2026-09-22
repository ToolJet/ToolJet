/** @group working */
import { BadRequestException } from '@nestjs/common';
import { AiService } from '@ee/ai/service';

describe('conversation attachment preparation', () => {
  const user = { id: 'fixture-builder', organizationId: 'fixture-workspace' };
  const current = '462ad1d5-1241-482a-8990-b51d62a98e6b';
  const earlier = 'efed7755-3f32-4859-9983-a8c9b0e57627';
  let service: any;
  let routing: any;
  beforeEach(() => {
    service = Object.create(AiService.prototype);
    routing = { provider: 'tooljet_managed', headers: { provider: 'gemini', model: 'fixture-model' } };
    Object.assign(service, {
      aiConversationRepository: { findOne: jest.fn().mockResolvedValue({ metadata: {} }), updateOne: jest.fn() },
      aiConversationMessageRepository: { find: jest.fn().mockResolvedValue([]) },
      licenseTermsService: { getLicenseTerms: jest.fn().mockResolvedValue({ aiPlan: 'credits' }) },
      aiUtilService: {
        resolveAgentRouting: jest.fn().mockResolvedValue(routing),
        resolveConversationLlmSelection: jest.fn().mockResolvedValue({ provider: 'gemini' }),
        listCompatibleOpenRouterModels: jest.fn().mockResolvedValue([
          {
            id: 'fixture/vision-model',
            name: 'Fixture Vision',
            inputModalities: ['text', 'image'],
            contextWindow: 240000,
          },
          { id: 'fixture/text-model', name: 'Fixture Text', inputModalities: ['text'], contextWindow: 240000 },
        ]),
        createNewConversation: jest.fn().mockResolvedValue({ id: 'continuation-chat' }),
        handoffThread: jest.fn().mockResolvedValue({ summary: 'A synthetic workshop inventory.' }),
      },
      attachmentService: {
        prepare: jest
          .fn()
          .mockResolvedValue({ attachments: [{ id: current }], content: [{ type: 'text', text: 'fixture' }] }),
      },
    });
  });

  it('keeps empty sends independent of model selection and storage', async () => {
    expect(await service.prepareAttachments(user, 'chat')).toEqual({
      attachments: [],
      content: [],
      routing: undefined,
    });
    expect(await service.prepareAttachments(user, 'chat', [])).toEqual({
      attachments: [],
      content: [],
      routing: undefined,
    });
    expect(service.aiUtilService.resolveAgentRouting).not.toHaveBeenCalled();
    expect(service.attachmentService.prepare).not.toHaveBeenCalled();
  });

  it.each([null, 'invalid'])('does not treat invalid attachment input as an empty send: %p', async (value) => {
    service.attachmentService.prepare.mockRejectedValue(new BadRequestException('Invalid attachments'));
    await expect(service.prepareAttachments(user, 'chat', value)).rejects.toThrow('Invalid attachments');
  });

  it('combines handoff and active user-message files with the same routing snapshot returned for the socket', async () => {
    service.aiConversationRepository.findOne.mockResolvedValue({ metadata: { attachmentIds: [earlier] } });
    service.aiConversationMessageRepository.find.mockResolvedValue([{ metadata: { attachments: [{ id: earlier }] } }]);
    const result = await service.prepareAttachments(user, 'chat', [current]);
    expect(service.aiConversationMessageRepository.find).toHaveBeenCalledWith({
      where: { aiConversationId: 'chat', messageType: 'user', isLatest: true, deleted: false },
      select: ['metadata'],
      order: { createdAt: 'ASC' },
    });
    expect(service.attachmentService.prepare).toHaveBeenCalledWith(user, [current], [earlier], 'gemini');
    expect(result.routing).toBe(routing);
    expect(result.attachments).toEqual([{ id: current }]);
    expect(service.aiUtilService.resolveAgentRouting).toHaveBeenCalledTimes(1);
  });

  it.each(['openai-agents', 'anthropic-agents'])('rejects unsupported %s before downloading', async (provider) => {
    routing.headers.provider = provider;
    await expect(service.prepareAttachments(user, 'chat', [current])).rejects.toThrow('builder chats');
    expect(service.attachmentService.prepare).not.toHaveBeenCalled();
  });

  it.each(['vision', 'text'])(
    'uses the pinned OpenRouter %s model capabilities for current and saved files',
    async (kind) => {
      routing.headers = { provider: 'openrouter', model: `fixture/${kind}-model` };
      service.aiConversationRepository.findOne.mockResolvedValue({ metadata: { attachmentIds: [earlier] } });
      const result = await service.prepareAttachments(user, 'chat', [current]);
      expect(service.attachmentService.prepare).toHaveBeenCalledWith(user, [current], [earlier], 'openrouter', {
        name: kind === 'vision' ? 'Fixture Vision' : 'Fixture Text',
        inputModalities: kind === 'vision' ? ['text', 'image'] : ['text'],
      });
      expect(result.routing).toBe(routing);
    }
  );

  it.each([undefined, 'fixture/missing-model'])(
    'rejects an unavailable OpenRouter selection before preparing files: %s',
    async (model) => {
      routing.headers = { provider: 'openrouter', model };
      await expect(service.prepareAttachments(user, 'chat', [current])).rejects.toThrow(
        'Choose an available OpenRouter model'
      );
      expect(service.attachmentService.prepare).not.toHaveBeenCalled();
    }
  );

  it('carries unique file IDs through successive owned continuation chats', async () => {
    service.aiConversationRepository.findOne.mockResolvedValue({
      id: 'previous-chat',
      userId: user.id,
      metadata: { attachmentIds: [earlier], phasePlan: 'fixture' },
    });
    service.aiConversationMessageRepository.find.mockResolvedValue([
      { metadata: { attachments: [{ id: earlier }, { id: current }] } },
    ]);
    const result = await service.createConversation(
      user.id,
      'fixture-app',
      'generate',
      user.organizationId,
      'previous-chat',
      true,
      user
    );
    expect(service.aiConversationRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'previous-chat', userId: user.id, app: { organizationId: user.organizationId } },
      relations: ['app'],
    });
    expect(result.metadata).toEqual({ attachmentIds: [earlier, current], phasePlan: 'fixture' });
    await service.prepareAttachments(user, 'continuation-chat', []);
    expect(service.attachmentService.prepare).toHaveBeenCalledWith(user, [], [earlier, current], 'gemini');
  });
});
