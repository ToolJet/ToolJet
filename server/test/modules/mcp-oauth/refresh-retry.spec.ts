import { openRefreshRetry, sealRefreshRetry } from '@modules/mcp-oauth/refresh-retry';

test('retry envelopes authenticate the complete tag, purpose key and artifact binding', () => {
  const secret = 'synthetic-retry-encryption-key';
  const response = { access_token: 'synthetic-access', refresh_token: 'synthetic-refresh' };
  const sealed = sealRefreshRetry(secret, 'artifact-one', response);
  expect(openRefreshRetry(secret, 'artifact-one', sealed)).toEqual(response);
  expect(openRefreshRetry(secret, 'artifact-two', sealed)).toBeUndefined();
  expect(openRefreshRetry('different-key', 'artifact-one', sealed)).toBeUndefined();
  const bytes = Buffer.from(sealed, 'base64url');
  for (const length of [0, 12, 16, 27])
    expect(openRefreshRetry(secret, 'artifact-one', bytes.subarray(0, length).toString('base64url'))).toBeUndefined();
  bytes[12] ^= 1;
  expect(openRefreshRetry(secret, 'artifact-one', bytes.toString('base64url'))).toBeUndefined();
});
