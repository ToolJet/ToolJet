import OpenRouter from '../lib';
import { buildChatPayload, getChatCompletion } from '../lib/query_operations';

jest.mock('@tooljet-marketplace/common', () => ({ QueryError: class extends Error {
  constructor(_title, message) { super(message); }
} }));

const key = 'synthetic-review-key';
function setup() {
  const plugin = new OpenRouter();
  const client = { get: jest.fn(), models: { list: jest.fn().mockResolvedValue({ data: [{ id: 'demo' }] }) } };
  jest.spyOn(plugin, 'getConnection').mockResolvedValue(client as any);
  return { plugin, client };
}
test('rejects an invalid OpenRouter credential even when the public catalogue works', async () => {
  const { plugin, client } = setup();
  client.get.mockRejectedValue(new Error('Invalid credential'));
  await expect(plugin.testConnection({ apiKey: key })).rejects.toThrow('Invalid credential');
  expect(client.get).toHaveBeenCalledWith('/key');
  expect(client.models.list).not.toHaveBeenCalled();
});
test('validates an OpenRouter key without running a paid completion', async () => {
  const { plugin, client } = setup();
  client.get.mockResolvedValue({ data: { limit: 5 } });
  await expect(plugin.testConnection({ apiKey: key, baseUrl: 'https://openrouter.ai/api/v1/' })).resolves.toEqual({ status: 'ok' });
});
test('keeps model discovery for a custom compatible endpoint', async () => {
  const { plugin, client } = setup();
  await expect(plugin.testConnection({ apiKey: key, baseUrl: 'https://model.example/v1' })).resolves.toEqual({ status: 'ok' });
  expect(client.get).not.toHaveBeenCalled();
  expect(client.models.list).toHaveBeenCalledTimes(1);
});
test('preserves privacy policy, fallbacks, and explicit zero numeric settings', () => {
  const payload = buildChatPayload({ operation: 'chat', model: 'demo/primary', prompt: 'Summarize fleet maintenance', fallback_models: 'demo/backup', data_collection: 'deny', temperature: '0', max_tokens: '' } as any);
  expect(payload).toMatchObject({ models: ['demo/primary', 'demo/backup'], provider: { data_collection: 'deny' }, temperature: 0 });
  expect(payload).not.toHaveProperty('max_tokens');
});
test('returns the documented message and provider fields', async () => {
  const client = { chat: { completions: { create: jest.fn().mockResolvedValue({ choices: [{ message: { content: 'Ready' }, finish_reason: 'stop' }], model: 'demo/backup', provider: 'Example' }) } } };
  expect(await getChatCompletion(client as any, { operation: 'chat' } as any)).toMatchObject({ message: 'Ready', model: 'demo/backup', provider: 'Example', finish_reason: 'stop' });
});
