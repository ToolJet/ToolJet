/** @group ai */
import { randomBytes } from 'crypto';
import { isLlmKeyRequest, sanitizeOAuthRequest, sanitizeTraceObject } from '@otel/sanitize';

it('redacts the LLM settings credential and the agent configuration envelope from HTTP telemetry', () => {
  const apikey = randomBytes(24).toString('hex');
  const encoded = Buffer.from(JSON.stringify({ apikey })).toString('base64');
  const request = {
    url: '/api/ai/test-key',
    body: { authType: 'custom', headerName: 'x-inference-ticket', apikey },
    headers: { 'x-tooljet-llm-config': encoded },
  };
  const sanitized = sanitizeOAuthRequest(request);
  expect(sanitized.body).toBe('[REDACTED]');
  expect(sanitized.headers['x-tooljet-llm-config']).toBe('[REDACTED]');
  expect(sanitizeTraceObject({ apikey })).toEqual({ apikey: '[REDACTED]' });
  expect(isLlmKeyRequest('https://tools.example.invalid/team/api/ai/update-key?source=form')).toBe(true);
});
