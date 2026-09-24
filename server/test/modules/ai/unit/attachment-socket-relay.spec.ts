/** @group working */
import { attachmentRequestHandler, isAttachmentRelayMissing } from '@ee/ai/attachment-socket-relay';
import { MAX_AI_ATTACHMENT_BYTES } from '@modules/ai/services/ai-attachment.service';

const request = {
  request_id: 'fixture-request',
  thread_id: 'fixture-thread',
  attachment_id: 'fixture-file',
};
const bytes = Buffer.from('building,floors\nLibrary,4');
const original = {
  body: bytes,
  name: 'floors.csv',
  type: 'text/csv',
  size: bytes.length,
};

describe('scoped attachment socket reads', () => {
  let read: jest.Mock;
  let closed: boolean;
  let handler: ReturnType<typeof attachmentRequestHandler>;
  beforeEach(() => {
    read = jest.fn().mockResolvedValue(original);
    closed = false;
    handler = attachmentRequestHandler({
      threadId: request.thread_id,
      attachmentIds: [request.attachment_id],
      isClosed: () => closed,
      read,
    });
  });

  it('acknowledges exactly one original without accepting injected user identities', async () => {
    const acknowledge = jest.fn();
    await handler({ ...request, user_id: 'forged' } as any, acknowledge);
    expect(read).toHaveBeenCalledWith(request.attachment_id);
    expect(acknowledge).toHaveBeenCalledWith({
      id: request.attachment_id,
      name: original.name,
      type: original.type,
      size: bytes.length,
      data: bytes.toString('base64'),
    });
  });

  it.each([{ thread_id: 'other-thread' }, { attachment_id: 'other-file' }, { request_id: '' }])(
    'rejects out-of-scope requests before storage: %p',
    async (override) => {
      const acknowledge = jest.fn();
      await handler({ ...request, ...override }, acknowledge);
      expect(read).not.toHaveBeenCalled();
      expect(acknowledge).toHaveBeenCalledWith({ error: expect.any(String) });
    }
  );

  it('fits an exact 10 MiB original in the existing 30 MiB socket budget', async () => {
    const body = Buffer.alloc(MAX_AI_ATTACHMENT_BYTES, 0x37);
    read.mockResolvedValue({ ...original, body, size: body.length });
    const acknowledge = jest.fn();
    await handler(request, acknowledge);
    const response = acknowledge.mock.calls[0][0];
    expect(Buffer.from(response.data, 'base64').equals(body)).toBe(true);
    expect(Buffer.byteLength(JSON.stringify(response))).toBeLessThan(30 * 1024 * 1024);
  });

  it('bounds concurrent reads and suppresses content after cancellation', async () => {
    let release;
    read.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );
    const first = jest.fn();
    const second = jest.fn();
    const third = jest.fn();
    const pendingFirst = handler(request, first);
    const releaseFirst = release;
    const pendingSecond = handler(request, second);
    const releaseSecond = release;
    await handler(request, third);
    expect(third).toHaveBeenCalledWith({
      error: expect.stringContaining('Too many'),
    });
    expect(read).toHaveBeenCalledTimes(2);
    closed = true;
    releaseFirst(original);
    releaseSecond(original);
    await Promise.all([pendingFirst, pendingSecond]);
    expect(first).toHaveBeenCalledWith({
      error: expect.stringContaining('cancelled'),
    });
    expect(second).toHaveBeenCalledWith({
      error: expect.stringContaining('cancelled'),
    });
  });

  it('returns safe errors and never reads after cancellation', async () => {
    const acknowledge = jest.fn();
    read.mockRejectedValue(new Error('private credentials in exception'));
    await handler(request, acknowledge);
    expect(JSON.stringify(acknowledge.mock.calls)).not.toContain('private credentials');
    closed = true;
    await handler(request, acknowledge);
    expect(read).toHaveBeenCalledTimes(1);
  });
});

describe('attachment relay compatibility', () => {
  it.each([undefined, false])('requires an agent update for attached files without support: %p', (supported) => {
    expect(isAttachmentRelayMissing([{ id: 'fixture-file' }], supported)).toBe(true);
  });

  it('allows attached files when the agent advertises support', () => {
    expect(isAttachmentRelayMissing([{ id: 'fixture-file' }], true)).toBe(false);
  });

  it.each([undefined, []])('keeps file-free requests compatible with old agents: %p', (manifest) => {
    expect(isAttachmentRelayMissing(manifest, undefined)).toBe(false);
  });
});
