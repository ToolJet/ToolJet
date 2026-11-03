/**
 * @group working
 * @group security
 */
import { parseRegistration } from '@modules/mcp-oauth/parsers';

describe('MCP OAuth registered client names', () => {
  test('rejects every ASCII control character in registered client names', () => {
    const redirect_uris = ['https://client.synthetic.example/callback'];
    for (const code of [...Array.from({ length: 32 }, (_, index) => index), 127]) {
      expect(() => parseRegistration({ redirect_uris, client_name: `Client${String.fromCharCode(code)}name` })).toThrow(
        expect.objectContaining({ error: 'invalid_client_metadata' })
      );
    }
  });
  test('preserves Unicode client names and the existing length boundary', () => {
    const redirect_uris = ['https://client.synthetic.example/callback'];
    const name = 'é'.repeat(120);
    expect(parseRegistration({ redirect_uris, client_name: name }).name).toBe(name);
    expect(() => parseRegistration({ redirect_uris, client_name: name + 'x' })).toThrow(
      expect.objectContaining({ error: 'invalid_client_metadata' })
    );
  });
});
