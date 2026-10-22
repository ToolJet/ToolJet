'use strict';

import { redactHeaders } from '../lib/utils.helper';

describe('redactHeaders', () => {
  it('redacts a blacklisted header regardless of casing', () => {
    expect(redactHeaders({ Authorization: 'Bearer secret' })).toEqual({ Authorization: '[REDACTED]' });
    expect(redactHeaders({ AUTHORIZATION: 'Bearer secret' })).toEqual({ AUTHORIZATION: '[REDACTED]' });
    expect(redactHeaders({ authorization: 'Bearer secret' })).toEqual({ authorization: '[REDACTED]' });
  });

  it('redacts other well-known sensitive headers case-insensitively', () => {
    expect(redactHeaders({ 'X-Api-Key': 'k' })).toEqual({ 'X-Api-Key': '[REDACTED]' });
    expect(redactHeaders({ 'Proxy-Authorization': 'p' })).toEqual({ 'Proxy-Authorization': '[REDACTED]' });
  });

  it('leaves non-blacklisted headers untouched (name-based redaction cannot cover custom headers)', () => {
    expect(redactHeaders({ 'x-custom-auth': 'plain' })).toEqual({ 'x-custom-auth': 'plain' });
  });

  it('does not mutate the input object', () => {
    const input = { Authorization: 'Bearer secret' };
    redactHeaders(input);
    expect(input).toEqual({ Authorization: 'Bearer secret' });
  });
});
