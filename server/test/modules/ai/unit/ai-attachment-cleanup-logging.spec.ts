/** @group working */
import { Logger } from '@nestjs/common';
import { AiAttachmentCleanupListener } from '@modules/ai/services/ai-attachment-cleanup.listener';

describe('AI attachment sweep diagnostics', () => {
  afterEach(() => jest.restoreAllMocks());

  it('logs the database failure code without message content and allows the next sweep', async () => {
    const warn = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
    const attachments = {
      sweep: jest
        .fn()
        .mockRejectedValueOnce(Object.assign(new Error('private potting ledger'), { code: '57014' }))
        .mockResolvedValueOnce(undefined),
    };
    const listener = new AiAttachmentCleanupListener(attachments as any);
    await listener.sweep();
    await listener.sweep();
    expect(warn).toHaveBeenCalledWith('Attachment sweep will retry (type=Error, code=57014).', 'AiAttachmentCleanup');
    expect(JSON.stringify(warn.mock.calls)).not.toContain('private');
    expect(attachments.sweep).toHaveBeenCalledTimes(2);
  });
});
