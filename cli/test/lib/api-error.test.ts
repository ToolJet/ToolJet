import { expect } from 'chai';

import { parseApiErrorMessage } from '../../src/lib/api-error';

describe('parseApiErrorMessage', () => {
  it('extracts the message field from a JSON error body', () => {
    const body = JSON.stringify({ statusCode: 401, message: 'Invalid CLI token', timestamp: 'x', path: '/y' });
    expect(parseApiErrorMessage(401, body)).to.equal('Invalid CLI token');
  });

  it('falls back to the raw body when it is not JSON', () => {
    expect(parseApiErrorMessage(500, 'Internal Server Error')).to.equal('Internal Server Error');
  });

  it('falls back to a generic message when the body is empty', () => {
    expect(parseApiErrorMessage(503, '')).to.equal('Request failed with status 503');
  });

  it('falls back to the raw body when JSON has no message field', () => {
    const body = JSON.stringify({ statusCode: 400 });
    expect(parseApiErrorMessage(400, body)).to.equal(body);
  });
});
