/** @group working */
const savedMessages: any[] = [];
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: (operation) =>
    operation({
      save: async (message) => {
        savedMessages.push(message);
        return message;
      },
    }),
}));

import { AiController } from '@ee/ai/controller';
import { AiService } from '@ee/ai/service';

describe('AI message attachment admission', () => {
  const user = { id: 'synthetic-builder', organizationId: 'synthetic-workspace' };
  let ai: any;
  let storage: any;
  let controller: AiController;
  let response: any;
  beforeEach(() => {
    ai = {
      assertConversationOwner: jest.fn().mockResolvedValue(undefined),
      prepareAttachments: jest.fn().mockResolvedValue({ attachments: [], manifest: [], routing: {} }),
      sendUserMessage: jest.fn(),
    };
    storage = { upload: jest.fn() };
    controller = new AiController(ai, storage);
    response = { setHeader: jest.fn(), flushHeaders: jest.fn(), write: jest.fn() };
  });
  it('rejects standalone uploads without calling storage or starting AI', async () => {
    await expect(controller.uploadAttachment()).rejects.toThrow('Standalone uploads are not supported');
    expect(storage.upload).not.toHaveBeenCalled();
    expect(ai.sendUserMessage).not.toHaveBeenCalled();
  });
  it.each(['', '  '])('rejects file-only requests without an AI message: %p', async (content) => {
    await expect(
      controller.sendUserMessage(user, { conversationId: 'chat', content, references: {} }, response, [
        { buffer: Buffer.from('bin,4'), size: 5, originalname: 'bins.csv', mimetype: 'text/csv' },
      ])
    ).rejects.toThrow('Enter an AI message');
    expect(ai.sendUserMessage).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it('rejects malformed multipart metadata before storage', async () => {
    await expect(controller.sendUserMessage(user, { payload: '{invalid' } as any, response)).rejects.toThrow(
      'Invalid AI message'
    );
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it('checks conversation ownership before accepting files', async () => {
    ai.assertConversationOwner.mockRejectedValue(new Error('Conversation unavailable'));
    await expect(
      controller.sendUserMessage(
        user,
        { conversationId: 'foreign-chat', content: 'Summarize the orchard ledger.', references: {} },
        response
      )
    ).rejects.toThrow('Conversation unavailable');
    expect(storage.upload).not.toHaveBeenCalled();
    expect(ai.sendUserMessage).not.toHaveBeenCalled();
  });
  it('passes originals only to the admitted message handler', async () => {
    const files = [{ buffer: Buffer.from('orchard,7'), size: 9, originalname: 'orchard.csv', mimetype: 'text/csv' }];
    const payload = { conversationId: 'owned-chat', content: 'Summarize the orchard ledger.', references: {} };
    await controller.sendUserMessage(user, { payload: JSON.stringify(payload) } as any, response, files);
    expect(ai.assertConversationOwner).toHaveBeenCalledWith(user, 'owned-chat');
    expect(ai.prepareAttachments).toHaveBeenCalledWith(user, 'owned-chat', undefined, true);
    expect(ai.sendUserMessage).toHaveBeenCalledWith(user, expect.objectContaining(payload), response, files);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it('preserves existing non-file interrupt replies with empty text', async () => {
    const payload = {
      conversationId: 'owned-chat',
      content: '',
      references: {},
      interruptConfig: { type: 'review_phase_plan', content: 'continue' },
    };
    await controller.sendUserMessage(user, payload, response);
    expect(ai.sendUserMessage).toHaveBeenCalledWith(user, expect.objectContaining(payload), response, []);
  });
});

describe('AI eligibility precedes attachment storage', () => {
  let service: any;
  let response: any;
  const user = { id: 'synthetic-builder', organizationId: 'synthetic-workspace' };
  const files = () => [{ buffer: Buffer.from('bin,4'), size: 5, originalname: 'bins.csv', mimetype: 'text/csv' }];
  beforeEach(() => {
    service = Object.create(AiService.prototype);
    Object.assign(service, {
      aiUtilService: {
        beginActiveRun: jest.fn().mockResolvedValue('synthetic-run'),
        endActiveRun: jest.fn(),
        callAgent: jest.fn(),
      },
      attachmentService: {
        upload: jest.fn(),
        retain: jest.fn(),
        discardFailedSubmission: jest.fn().mockResolvedValue(undefined),
      },
      checkSpend: jest.fn().mockResolvedValue({ refusal: null }),
      generateErrorMessageForUser: jest.fn().mockResolvedValue({ content: 'Synthetic error' }),
      sendSSE: jest.fn(),
      aiConversationRepository: { findOne: jest.fn().mockResolvedValue({ archived: true, app: {} }) },
    });
    response = { on: jest.fn(), end: jest.fn(), write: jest.fn() };
  });
  it('does not store files or start a run when the spend check refuses', async () => {
    service.checkSpend.mockResolvedValue({ refusal: 'pool_empty' });
    await service.sendUserMessage(user, { conversationId: 'owned-chat', content: 'Read the bins.' }, response, files());
    expect(service.attachmentService.upload).not.toHaveBeenCalled();
    expect(service.aiUtilService.callAgent).not.toHaveBeenCalled();
    expect(service.aiUtilService.beginActiveRun).not.toHaveBeenCalled();
    expect(service.aiUtilService.endActiveRun).not.toHaveBeenCalled();
    expect(response.end).toHaveBeenCalled();
  });
  it('does not store files for an archived conversation', async () => {
    await service.sendUserMessage(user, { conversationId: 'owned-chat', content: 'Read the bins.' }, response, files());
    expect(service.attachmentService.upload).not.toHaveBeenCalled();
    expect(service.aiUtilService.callAgent).not.toHaveBeenCalled();
  });
  it('cleans up a partial batch when a later upload fails', async () => {
    service.aiConversationRepository.findOne.mockResolvedValue({ app: { editingVersion: {} } });
    service.attachmentService.upload
      .mockResolvedValueOnce({ id: 'first-original' })
      .mockRejectedValueOnce(new Error('Synthetic storage failure'));
    const consoleError = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await service.sendUserMessage(
        user,
        { conversationId: 'owned-chat', content: 'Read these bin lists.' },
        response,
        [...files(), ...files()]
      );
      expect(service.attachmentService.discardFailedSubmission).toHaveBeenCalledWith(
        user,
        ['first-original'],
        'owned-chat'
      );
      expect(service.aiUtilService.callAgent).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
  it('keeps files once the user message is committed even if app export fails', async () => {
    savedMessages.length = 0;
    service.aiConversationRepository.findOne.mockResolvedValue({
      app: {
        id: 'synthetic-app',
        type: 'module',
        editingVersion: { id: 'synthetic-version' },
      },
    });
    service.attachmentService.upload.mockResolvedValue({
      id: 'durable-original',
    });
    service.importExportResourcesService = {
      export: jest.fn().mockRejectedValue(new Error('Synthetic export outage')),
    };
    await service.sendUserMessage(
      user,
      {
        conversationId: 'owned-chat',
        content: 'Summarize the seed inventory.',
      },
      response,
      files()
    );
    expect(savedMessages).toHaveLength(1);
    expect(savedMessages[0].metadata.attachments).toEqual([{ id: 'durable-original' }]);
    expect(service.attachmentService.discardFailedSubmission).not.toHaveBeenCalled();
  });

  it('keeps the preparation run alive and cancels an in-flight upload before saving', async () => {
    jest.useFakeTimers();
    service.aiConversationRepository.findOne.mockResolvedValue({ app: { editingVersion: {} } });
    service.aiUtilService.touchActiveRun = jest.fn();
    service.aiUtilService.isCancellationRequested = jest.fn().mockResolvedValue(false);
    let uploadStarted;
    const ready = new Promise((resolve) => {
      uploadStarted = resolve;
    });
    service.attachmentService.upload.mockImplementation((_user, _file, signal) => {
      uploadStarted();
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
    });
    try {
      const pending = service.sendUserMessage(
        user,
        { conversationId: 'owned-chat', content: 'Inspect the seedlings.' },
        response,
        files()
      );
      await ready;
      await jest.advanceTimersByTimeAsync(125000);
      expect(service.aiUtilService.touchActiveRun.mock.calls.length).toBeGreaterThanOrEqual(4);
      service.aiUtilService.isCancellationRequested.mockResolvedValue(true);
      await jest.advanceTimersByTimeAsync(1000);
      await pending;
      expect(service.attachmentService.retain).not.toHaveBeenCalled();
      expect(service.aiUtilService.callAgent).not.toHaveBeenCalled();
      expect(service.aiUtilService.endActiveRun).toHaveBeenCalledWith('synthetic-run');
      expect(service.sendSSE).toHaveBeenCalledWith(response, 'agent_result', { cancelled: true, reload: false });
    } finally {
      jest.useRealTimers();
    }
  });
});
