/** @group working */
const mockSaveMessage = jest.fn(async (message) => message);
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: (operation) => operation({ save: mockSaveMessage }),
}));

import { EventEmitter } from 'events';
import { AiService } from '@ee/ai/service';

describe('AI clarification presentation', () => {
  const user = { id: 'builder-example', organizationId: 'workspace-example', email: 'builder@example.test' };
  let service: any;
  let conversation: any;
  let response: any;
  let events: any[];
  let agentError: any;

  beforeEach(() => {
    events = [];
    agentError = null;
    conversation = {
      id: 'equipment-conversation',
      metadata: {},
      app: {
        id: 'equipment-app',
        organizationId: user.organizationId,
        type: 'front-end',
        editingVersion: { id: 'draft-version', currentEnvironmentId: 'development' },
        aiGenerationMetadata: {},
      },
    };
    response = new EventEmitter();
    response.end = jest.fn(() => response.emit('close'));
    response.write = jest.fn();
    service = Object.create(AiService.prototype);
    Object.assign(service, {
      attachmentService: { retain: jest.fn() },
      getCreditsBalance: jest.fn().mockResolvedValue({ balance: 100 }),
      sendSSE: jest.fn(),
      maybeSendBuildCompletionEmail: jest.fn(),
      generateErrorMessageForUser: jest.fn().mockResolvedValue({ content: 'Unexpected failure' }),
      aiUtilService: {
        beginActiveRun: jest.fn().mockResolvedValue('equipment-run'),
        endActiveRun: jest.fn(),
        callAgent: jest.fn(async (_route, _payload, _user, _organization, callbacks) => {
          for (const event of events) await callbacks.handleAiMessagePush(event);
          return [agentError, agentError ? null : { intent: 'none' }];
        }),
      },
      aiConversationRepository: {
        findOne: jest.fn().mockResolvedValue(conversation),
        updateOne: jest.fn(),
      },
      aiConversationMessageRepository: {
        save: jest.fn(async (message) => message),
        countByConversationId: jest.fn().mockResolvedValue(2),
        find: jest.fn().mockResolvedValue([]),
      },
      appRepository: { update: jest.fn() },
      importExportResourcesService: { export: jest.fn().mockResolvedValue({}) },
    });
  });

  const send = async (content = 'Add a maintenance summary to the equipment app.') => {
    await service.sendUserMessage(user, { conversationId: conversation.id, content }, response);
    expect(service.generateErrorMessageForUser).not.toHaveBeenCalled();
    return service.aiConversationMessageRepository.save.mock.calls
      .map(([message]) => message)
      .find((message) => message.messageType === 'ai');
  };

  it('keeps long clarification questions in chat without synthesizing a choice widget', async () => {
    const question = 'May I add a calculated maintenance total using the built-in JavaScript query source?';
    events.push({
      interrupt: true,
      interrupt_id: 'calculation-question',
      message: question,
      resume_suggestions: [
        'Include the calculation and keep all existing equipment fields and maintenance filters unchanged',
        'Keep the current data and leave the additional maintenance total out of this update',
      ],
    });
    const message = await send();
    expect(message.metadata.sections).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'markdown', content: question })])
    );
    expect(message.metadata.sections.some((section) => section.type === 'output-widget-interactive')).toBe(false);
    expect(conversation.app.aiGenerationMetadata).toMatchObject({
      interrupt: true,
      interruptId: 'calculation-question',
    });
    expect(service.sendSSE).toHaveBeenCalledWith(
      response,
      'agent_result',
      expect.objectContaining({ awaitingInput: true, failed: false })
    );
  });

  it('preserves the separate datasource connection card after a missing-source pause', async () => {
    const connector = { label: 'Google Sheets', kind: 'googlesheets', install: false };
    events.push(
      {
        interrupt: true,
        interrupt_id: 'source-question',
        message: 'Connect Google Sheets to read the equipment register.',
        resume_suggestions: [],
      },
      { contentType: 'datasource-connect', title: '', content: connector }
    );
    const message = await send();
    expect(message.metadata.sections).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'datasource-connect', content: connector })])
    );
    expect(message.metadata.sections.some((section) => section.type === 'output-widget-interactive')).toBe(false);
    expect(message.metadata.sections[0]).toMatchObject({
      type: 'markdown',
      content: 'Connect Google Sheets to read the equipment register.',
    });
    expect(service.sendSSE).toHaveBeenCalledWith(
      response,
      'agent_result',
      expect.objectContaining({ awaitingInput: true, failed: false })
    );
  });

  it('keeps a datasource connection card actionable when the agent returns build_incomplete', async () => {
    const connector = { label: 'Google Sheets', kind: 'googlesheets', install: false };
    agentError = { category: 'build_incomplete', message: 'Missing equipment data connection' };
    events.push(
      { contentType: 'markdown', content: 'Connect Google Sheets before building the equipment register.' },
      { contentType: 'datasource-connect', title: '', content: connector }
    );
    const message = await send();
    expect(message.metadata.sections).toEqual([
      expect.objectContaining({ type: 'markdown', content: events[0].content }),
      expect.objectContaining({ type: 'datasource-connect', content: connector }),
    ]);
    expect(service.sendSSE).toHaveBeenCalledWith(
      response,
      'agent_result',
      expect.objectContaining({ awaitingInput: true, failed: false })
    );
  });

  it('continues forwarding a typed answer to the same saved interrupt', async () => {
    conversation.app.aiGenerationMetadata = { interrupt: true, interruptId: 'calculation-question' };
    const answer = 'Leave the additional total out and keep the equipment fields unchanged.';
    await send(answer);
    expect(mockSaveMessage).toHaveBeenCalledWith(
      expect.objectContaining({ messageType: 'user', content: answer })
    );
    expect(service.aiUtilService.callAgent).toHaveBeenCalledWith(
      'deep-agent-resume',
      expect.objectContaining({ interrupt_id: 'calculation-question', interruptConfig: answer }),
      user,
      user.organizationId,
      expect.any(Object),
      'app',
      undefined
    );
  });

  it('retains explicitly emitted query-preview widgets', async () => {
    events.push({
      render_widget: true,
      widget: {
        type: 'query_preview',
        header: { title: 'Preview the equipment query?', artifact: { content: { queryId: 'equipment-query' } } },
        responseActions: ['Preview query', 'Skip preview'],
        primaryCta: [{ id: 'continue', label: 'Continue' }],
      },
    });
    const message = await send();
    expect(message.metadata.sections).toEqual([
      expect.objectContaining({
        type: 'output-widget-interactive',
        responseActions: ['Preview query', 'Skip preview'],
        header: expect.objectContaining({ title: 'Preview the equipment query?' }),
      }),
    ]);
  });
});
