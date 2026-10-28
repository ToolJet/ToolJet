/** @group platform */
import { Logger } from '@nestjs/common';
import { AiAttachmentCleanupListener } from '@modules/ai/services/ai-attachment-cleanup.listener';

describe('attachment cleanup scheduling', () => {
  let attachments: { sweep: jest.Mock; cleanupDeletedConversations: jest.Mock };
  let listener: AiAttachmentCleanupListener;
  beforeEach(() => {
    attachments = { sweep: jest.fn(), cleanupDeletedConversations: jest.fn() };
    listener = new AiAttachmentCleanupListener(
      attachments as unknown as ConstructorParameters<typeof AiAttachmentCleanupListener>[0]
    );
    jest.spyOn(Logger, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('coalesces overlapping ticks and allows the next sweep after completion', async () => {
    let finish: () => void;
    attachments.sweep.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const first = listener.sweep();
    await listener.sweep();
    expect(attachments.sweep).toHaveBeenCalledTimes(1);
    finish();
    await first;
    await listener.sweep();
    expect(attachments.sweep).toHaveBeenCalledTimes(2);
  });

  it('releases the sweep lock after failure without logging remote error details', async () => {
    attachments.sweep.mockRejectedValueOnce(new Error('remote payload: synthetic-private-value'));
    await expect(listener.sweep()).resolves.toBeUndefined();
    await listener.sweep();
    expect(attachments.sweep).toHaveBeenCalledTimes(2);
    expect(Logger.warn).toHaveBeenCalledWith('Attachment sweep will retry.', 'AiAttachmentCleanup');
    expect(JSON.stringify((Logger.warn as jest.Mock).mock.calls)).not.toContain('synthetic-private-value');
  });

  it('passes the deleted workspace scope through and leaves failures retryable', async () => {
    attachments.cleanupDeletedConversations.mockRejectedValueOnce(new Error('unavailable'));
    await expect(listener.cleanup({ organizationId: 'workspace-orchard' })).resolves.toBeUndefined();
    await listener.cleanup({ organizationId: 'workspace-orchard' });
    expect(attachments.cleanupDeletedConversations.mock.calls).toEqual([['workspace-orchard'], ['workspace-orchard']]);
  });
});
