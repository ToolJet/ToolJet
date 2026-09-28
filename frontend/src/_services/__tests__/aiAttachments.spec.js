import { aiService } from '../ai.service';
import { fetchEventSource } from '@microsoft/fetch-event-source';

jest.mock('config', () => ({ apiUrl: 'https://app.example.test/api' }), { virtual: true });
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ 'Content-Type': 'application/json', 'x-test-auth': 'synthetic-session' }),
  handleResponse: jest.fn(),
}));
jest.mock('@microsoft/fetch-event-source', () => ({ fetchEventSource: jest.fn() }));

// jest-fixed-jsdom preserves Node FormData; use its matching File implementation.
const browserFile = global.File;
beforeAll(() => {
  global.File = require('buffer').File;
});
afterAll(() => {
  global.File = browserFile;
});

beforeEach(() => {
  fetchEventSource.mockImplementation(async (_url, options) => {
    await options.onopen({ ok: true });
    options.onclose();
  });
});

test('sends original files and the AI message together with a browser-generated multipart boundary', async () => {
  const original = new File(['rack,count\nBirch,6'], 'racks.csv', { type: 'text/csv' });
  const payload = { conversationId: 'owned-chat', content: 'Summarize the rack counts.' };
  await aiService.sendMessage({ ...payload, attachments: [original] }, jest.fn());
  const [url, options] = fetchEventSource.mock.calls[0];
  expect(url).toBe('https://app.example.test/api/ai/conversation/message');
  expect(options.headers['Content-Type']).toBeUndefined();
  expect(options.headers['x-test-auth']).toBe('synthetic-session');
  expect(options.body).toBeInstanceOf(FormData);
  expect(JSON.parse(options.body.get('payload'))).toEqual(payload);
  expect(options.body.getAll('files')).toHaveLength(1);
  expect(options.body.get('files').name).toBe(original.name);
  expect(options.body.get('files').size).toBe(original.size);
  expect(await options.body.get('files').text()).toBe('rack,count\nBirch,6');
});

test('keeps text-only requests as JSON and preserves earlier attachment references', async () => {
  await aiService.sendMessage(
    {
      conversationId: 'owned-chat',
      content: 'Explain the earlier file.',
      attachments: [{ id: 'stored-original', name: 'racks.csv' }],
    },
    jest.fn()
  );
  const options = fetchEventSource.mock.calls[0][1];
  expect(options.headers['Content-Type']).toBe('application/json');
  expect(JSON.parse(options.body)).toEqual({
    conversationId: 'owned-chat',
    content: 'Explain the earlier file.',
    attachmentIds: ['stored-original'],
  });
});

test('does not send originals to the docs-only endpoint', async () => {
  await expect(
    aiService.sendMessage(
      { content: 'Read the inventory.', attachments: [new File(['bins,4'], 'bins.csv')] },
      jest.fn(),
      true
    )
  ).rejects.toThrow('builder chats');
  expect(fetchEventSource).not.toHaveBeenCalled();
});
