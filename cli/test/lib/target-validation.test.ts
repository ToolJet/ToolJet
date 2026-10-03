import { expect } from 'chai';

import { isLoopbackHost, validateOriginUrl, validateApiToken } from '../../src/lib/library/target-validation';

describe('isLoopbackHost', () => {
  it('treats localhost, ::1, [::1], and 127.x.x.x as loopback', () => {
    expect(isLoopbackHost('localhost')).to.be.true;
    expect(isLoopbackHost('::1')).to.be.true;
    expect(isLoopbackHost('[::1]')).to.be.true;
    expect(isLoopbackHost('127.0.0.1')).to.be.true;
    expect(isLoopbackHost('127.1.2.3')).to.be.true;
  });

  it('rejects non-loopback hosts', () => {
    expect(isLoopbackHost('app.tooljet.ai')).to.be.false;
    expect(isLoopbackHost('10.0.0.1')).to.be.false;
    expect(isLoopbackHost('example.com')).to.be.false;
  });
});

describe('validateOriginUrl', () => {
  it('accepts a valid https URL', () => {
    expect(validateOriginUrl('https://app.tooljet.ai')).to.equal(true);
  });

  it('accepts http on localhost/127.0.0.1', () => {
    expect(validateOriginUrl('http://localhost:3000')).to.equal(true);
    expect(validateOriginUrl('http://127.0.0.1:3000')).to.equal(true);
  });

  it('rejects a malformed URL', () => {
    expect(validateOriginUrl('not a url')).to.be.a('string');
  });

  it('rejects a URL missing a protocol', () => {
    expect(validateOriginUrl('app.tooljet.ai')).to.be.a('string');
  });

  it('rejects http on a non-loopback host', () => {
    const result = validateOriginUrl('http://app.tooljet.ai');
    expect(result).to.be.a('string');
    expect(result as string).to.match(/https:\/\//);
  });
});

describe('validateApiToken', () => {
  it('rejects empty or whitespace-only input', () => {
    expect(validateApiToken('')).to.be.a('string');
    expect(validateApiToken('   ')).to.be.a('string');
  });

  it('accepts a non-empty token', () => {
    expect(validateApiToken('some-token')).to.equal(true);
  });
});
