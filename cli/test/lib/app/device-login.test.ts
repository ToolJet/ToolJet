import { expect } from 'chai';

import { approvePage, deviceLogin } from '../../../src/lib/app/device-login';

const reply = (status: number, body: unknown) => ({
  ok: status < 400,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

function fakeInstance(polls: Array<[number, unknown]>, start: Record<string, unknown> = {}) {
  const calls: { url: string; body: any }[] = [];
  const queue = [...polls];
  const fetch = async (url: string, init: { body: string }) => {
    calls.push({ url, body: JSON.parse(init.body) });
    if (url.endsWith('/device'))
      return reply(201, {
        deviceCode: 'dev-123',
        userCode: 'BCDF-GHJK',
        verificationUri: 'http://app.test/cli/activate',
        expiresIn: 600,
        interval: 3,
        ...start,
      });
    const [status, body] = queue.shift() ?? [200, { status: 'pending' }];
    return reply(status, body);
  };
  return { fetch, calls };
}

describe('tooljet auth login (device login)', () => {
  let clock: number;
  const sleeps: number[] = [];
  const sleep = async (ms: number) => {
    sleeps.push(ms);
    clock += ms;
  };
  beforeEach(() => {
    clock = 0;
    sleeps.length = 0;
  });

  it('shows the code and the page, polls until approved and returns the token', async () => {
    const instance = fakeInstance([
      [200, { status: 'pending' }],
      [200, { status: 'slow_down' }],
      [200, { status: 'approved', token: 'tj_pat_x', email: 'dev@example.com', organizationId: 'org1' }],
    ]);
    const shown: any[] = [];
    const result = await deviceLogin({
      url: 'http://api.test/',
      clientName: 'tooljet CLI on laptop',
      fetch: instance.fetch,
      sleep,
      now: () => clock,
      onCode: (s) => {
        shown.push(s);
      },
    });
    expect(result).to.deep.equal({ token: 'tj_pat_x', email: 'dev@example.com', organizationId: 'org1' });
    expect(shown).to.have.length(1);
    expect(shown[0].userCode).to.equal('BCDF-GHJK');
    expect(shown[0].verificationUri).to.equal('http://app.test/cli/activate');
    expect(instance.calls[0]).to.deep.equal({
      url: 'http://api.test/api/personal-access-tokens/device',
      body: { clientName: 'tooljet CLI on laptop' },
    });
    expect(
      instance.calls.slice(1).every((c) => c.url.endsWith('/device/token') && c.body.deviceCode === 'dev-123')
    ).to.equal(true);
    // The interval, then 2 s more after slow_down.
    expect(sleeps).to.deep.equal([3000, 3000, 5000]);
  });

  it('never puts the code or the token in the page address', () => {
    expect(approvePage('http://app.test/cli/activate?user_code=BCDF-GHJK#t=secret', 'http://api.test')).to.equal(
      'http://app.test/cli/activate'
    );
    expect(approvePage('/cli/activate', 'http://api.test')).to.equal('http://api.test/cli/activate');
  });

  it('stops when the code expires', async () => {
    const instance = fakeInstance([[200, { status: 'expired' }]]);
    let error: Error | undefined;
    await deviceLogin({
      url: 'http://api.test',
      clientName: 'cli',
      fetch: instance.fetch,
      sleep,
      now: () => clock,
      onCode: () => {},
    }).catch((e) => (error = e));
    expect(error?.message).to.contain('expired');
  });

  it('gives up at the deadline without an answer', async () => {
    const instance = fakeInstance([], { expiresIn: 9, interval: 3 });
    let error: Error | undefined;
    await deviceLogin({
      url: 'http://api.test',
      clientName: 'cli',
      fetch: instance.fetch,
      sleep,
      now: () => clock,
      onCode: () => {},
    }).catch((e) => (error = e));
    expect(error?.message).to.contain('expired');
    expect(instance.calls.length).to.equal(4);
  });

  it('points an instance without device login to tooljet login', async () => {
    const fetch = async () => reply(404, { message: 'Cannot POST' });
    let error: Error | undefined;
    await deviceLogin({ url: 'http://api.test', clientName: 'cli', fetch, sleep, onCode: () => {} }).catch(
      (e) => (error = e)
    );
    expect(error?.message).to.contain('tooljet login');
  });
});
