import { sanitizeOAuthRequest, sanitizeOAuthUrl, sanitizeTraceObject } from '@otel/sanitize';

const mockInfo = jest.fn();
jest.mock('@modules/logging/base-logger', () => ({ buildBaseLogger: () => ({ info: mockInfo }) }));
jest.mock('@modules/request-context/service', () => ({ RequestContext: {
  getTransactionId: () => 'synthetic-transaction',
  getRoute: () => '/api/mcp-oauth/interactions/synthetic-interaction/bootstrap',
  getStartTime: () => Date.now(),
} }));
import { TransactionLogger } from '@modules/logging/service';

const body = { ticket: 'synthetic-bootstrap-ticket', nonce: 'synthetic-browser-nonce', safe: 'metadata' };
test('request traces and HTTP log serialization redact bootstrap credentials without mutating the request', () => {
  expect(sanitizeTraceObject(body)).toEqual({ ticket: '[REDACTED]', nonce: '[REDACTED]', safe: 'metadata' });
  const request = { url: '/tools/api/mcp-oauth/interactions/synthetic-interaction/bootstrap', body };
  const result = sanitizeOAuthRequest(request);
  expect(result.url).toBe('/tools/api/mcp-oauth/interactions/[REDACTED]/bootstrap');
  expect(JSON.stringify(result)).not.toContain('synthetic-bootstrap-ticket');
  expect(JSON.stringify(result)).not.toContain('synthetic-browser-nonce');
  expect(request.body.ticket).toBe('synthetic-bootstrap-ticket');
});

test('nested bootstrap values and redirect fragments are redacted', () => {
  const nested = sanitizeTraceObject({ attempts: [{ bootstrap: 'synthetic-fragment', ...body }] });
  expect(nested.attempts[0].bootstrap).toBe('[REDACTED]');
  expect(sanitizeOAuthUrl('https://orchard.synthetic.example/mcp/consent?request=synthetic#bootstrap=synthetic-fragment'))
    .toBe('https://orchard.synthetic.example/mcp/consent');
});

test('transaction logging removes bootstrap credentials before stringifying objects', () => {
  new TransactionLogger().log('Synthetic bootstrap attempt', { body });
  const logged = JSON.stringify(mockInfo.mock.calls);
  expect(logged).not.toContain('synthetic-bootstrap-ticket');
  expect(logged).not.toContain('synthetic-browser-nonce');
  expect(logged).toContain('[REDACTED]');
});
