'use strict';

const mailtrap = require('../lib');

const jsonResponse = (status, body) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(JSON.stringify(body)) });

describe('mailtrap', () => {
  const service = new mailtrap.default();
  const sourceOptions = { api_token: 'token-123', sending_stream: 'transactional' };
  const baseQuery = {
    operation: 'send_email',
    from_email: 'sender@example.com',
    from_name: 'ToolJet',
    to: ['user@example.com'],
    subject: 'Hello',
    text: 'Hi there',
  };
  const originalFetch = global.fetch;
  let fetchMock;

  // The jest node environment does not expose fetch, so install a mock directly.
  beforeEach(() => {
    fetchMock = jest.fn(() => jsonResponse(200, { success: true, message_ids: ['abc'] }));
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const sentRequest = () => {
    const [url, init] = fetchMock.mock.calls[0];
    return { url, init, body: JSON.parse(init.body) };
  };

  describe('#send_email', () => {
    test('sends to the transactional endpoint with a bearer token', async () => {
      const result = await service.run(sourceOptions, baseQuery);

      const { url, init, body } = sentRequest();
      expect(url).toEqual('https://send.api.mailtrap.io/api/send');
      expect(init.method).toEqual('POST');
      expect(init.headers.Authorization).toEqual('Bearer token-123');
      expect(body).toEqual({
        from: { email: 'sender@example.com', name: 'ToolJet' },
        to: [{ email: 'user@example.com' }],
        subject: 'Hello',
        text: 'Hi there',
      });
      expect(result).toEqual({ status: 'ok', data: { success: true, message_ids: ['abc'] } });
    });

    test('uses the bulk endpoint', async () => {
      await service.run({ ...sourceOptions, sending_stream: 'bulk' }, baseQuery);
      expect(sentRequest().url).toEqual('https://bulk.api.mailtrap.io/api/send');
    });

    test('uses the sandbox endpoint with the inbox id', async () => {
      await service.run({ ...sourceOptions, sending_stream: 'sandbox', inbox_id: '42' }, baseQuery);
      expect(sentRequest().url).toEqual('https://sandbox.api.mailtrap.io/api/send/42');
    });

    test('requires an inbox id for the sandbox stream', async () => {
      await expect(service.run({ ...sourceOptions, sending_stream: 'sandbox' }, baseQuery)).rejects.toMatchObject({
        description: 'Inbox ID is required for the Sandbox sending stream',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('normalizes recipients and optional fields', async () => {
      await service.run(sourceOptions, {
        ...baseQuery,
        to: 'a@example.com, Jane Doe <jane@example.com>',
        cc: [{ email: 'c@example.com', name: 'C' }],
        bcc: '["b@example.com"]',
        reply_to: 'Support <support@example.com>',
        html: '<p>Hi</p>',
        category: 'Welcome',
        custom_variables: '{"user_id": "1"}',
        headers: { 'X-Source': 'tooljet' },
      });

      expect(sentRequest().body).toEqual({
        from: { email: 'sender@example.com', name: 'ToolJet' },
        to: [{ email: 'a@example.com' }, { email: 'jane@example.com', name: 'Jane Doe' }],
        cc: [{ email: 'c@example.com', name: 'C' }],
        bcc: [{ email: 'b@example.com' }],
        reply_to: { email: 'support@example.com', name: 'Support' },
        subject: 'Hello',
        text: 'Hi there',
        html: '<p>Hi</p>',
        category: 'Welcome',
        custom_variables: { user_id: '1' },
        headers: { 'X-Source': 'tooljet' },
      });
    });

    test('maps File Picker files to attachments', async () => {
      await service.run(sourceOptions, {
        ...baseQuery,
        attachments: [
          { name: 'a.txt', type: 'text/plain', content: 'hello', base64Data: 'aGVsbG8=' },
          { filename: 'b.png', content: 'data:image/png;base64,iVBOR', type: 'image/png', disposition: 'inline' },
        ],
      });

      expect(sentRequest().body.attachments).toEqual([
        { filename: 'a.txt', content: 'aGVsbG8=', type: 'text/plain' },
        { filename: 'b.png', content: 'iVBOR', type: 'image/png', disposition: 'inline' },
      ]);
    });

    test('requires a body', async () => {
      await expect(service.run(sourceOptions, { ...baseQuery, text: '' })).rejects.toMatchObject({
        description: 'Either a text or an HTML body is required',
      });
    });

    test('requires a recipient', async () => {
      await expect(service.run(sourceOptions, { ...baseQuery, to: '' })).rejects.toMatchObject({
        description: 'At least one recipient is required',
      });
    });

    test('rejects invalid JSON variables', async () => {
      await expect(service.run(sourceOptions, { ...baseQuery, custom_variables: '{oops' })).rejects.toMatchObject({
        description: 'Custom variables must be a JSON object',
      });
    });

    test('surfaces Mailtrap API errors', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse(400, { success: false, errors: ["'from' address domain is not verified"] })
      );

      await expect(service.run(sourceOptions, baseQuery)).rejects.toMatchObject({
        message: 'Query could not be completed',
        description: "'from' address domain is not verified",
        data: { statusCode: 400 },
      });
    });

    test('requires an API token', async () => {
      await expect(service.run({ ...sourceOptions, api_token: '' }, baseQuery)).rejects.toMatchObject({
        description: 'Mailtrap API token is not set',
      });
    });
  });

  describe('#send_template_email', () => {
    test('sends template uuid and variables without subject or body', async () => {
      await service.run(sourceOptions, {
        ...baseQuery,
        operation: 'send_template_email',
        template_uuid: 'tmpl-1',
        template_variables: { user_name: 'John' },
      });

      expect(sentRequest().body).toEqual({
        from: { email: 'sender@example.com', name: 'ToolJet' },
        to: [{ email: 'user@example.com' }],
        template_uuid: 'tmpl-1',
        template_variables: { user_name: 'John' },
      });
    });

    test('requires a template uuid', async () => {
      await expect(
        service.run(sourceOptions, { ...baseQuery, operation: 'send_template_email', template_uuid: '' })
      ).rejects.toMatchObject({ description: 'Template UUID is required' });
    });
  });

  describe('#testConnection', () => {
    test('checks the token against the accounts endpoint', async () => {
      fetchMock.mockImplementation(() => jsonResponse(200, [{ id: 1, name: 'Acme' }]));

      await expect(service.testConnection(sourceOptions)).resolves.toEqual({ status: 'ok' });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toEqual('https://mailtrap.io/api/accounts');
      expect(init.method).toEqual('GET');
    });

    test('fails on an invalid token', async () => {
      fetchMock.mockImplementation(() => jsonResponse(401, { error: 'Incorrect API token' }));

      await expect(service.testConnection(sourceOptions)).rejects.toThrow('Incorrect API token');
    });
  });
});
