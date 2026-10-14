import TypeSafe from '../lib';
import got from 'got';

jest.mock('@tooljet-marketplace/common', () => ({ QueryError: class extends Error {
  constructor(_title, message) { super(message); }
} }));
jest.mock('got', () => ({ __esModule: true, default: { post: jest.fn() }, HTTPError: class extends Error {} }));
const questions = { urgent: { type: 'noul', instructions: 'Does the machine need immediate service?' } };
beforeEach(() => (got.post as any).mockResolvedValue({ body: { model: 'jev-latest', answers: { urgent: { type: 'noul', noul: 0.9 } } } }));
test.each([
  [{ api_key: 'synthetic-key' }, undefined, 'https://api.typesafe.ai/v1/systemone', 'jev-latest'],
  [{ auth_type: 'openrouter', openrouter_api_key: 'synthetic-key' }, undefined, 'https://openrouter.ai/api/alpha/decisions', 'typesafe/jev-1.13'],
  [{ auth_type: 'openrouter', openrouter_api_key: 'synthetic-key' }, 'jev-latest', 'https://openrouter.ai/api/alpha/decisions', '~typesafe/jev-latest'],
])('routes the selected credential and model', async (source, model, url, expectedModel) => {
  const result = await new TypeSafe().run(source as any, { operation: 'evaluate', state: '{"asset":"pump"}', questions, model } as any, 'source-a');
  expect(got.post).toHaveBeenCalledWith(url, expect.objectContaining({ json: { state: { asset: 'pump' }, model: expectedModel, questions } }));
  expect(result.data).toMatchObject({ answers: { urgent: { noul: 0.9 } } });
});
test.each(['invalid json', {}, { urgency: { type: 'choice', instructions: 'Select severity', criteria: { low: 'Low' } } }])('rejects invalid questions before a provider call', async (invalid) => {
  await expect(new TypeSafe().run({ api_key: 'synthetic-key' }, { operation: 'evaluate', state: 'pump', questions: invalid } as any, 'source-a')).rejects.toThrow();
  expect(got.post).not.toHaveBeenCalled();
});
