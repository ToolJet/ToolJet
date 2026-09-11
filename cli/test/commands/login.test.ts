import nock = require('nock');
import { expect } from 'chai';
import * as inquirer from 'inquirer';
import * as sinon from 'sinon';

import Login from '../../src/commands/login';
import { Auth } from '../../src/lib/library/auth';
import { runCommand } from '../helpers/run-command';

const BASE_URL = 'https://app.tooljet.test';

describe('login', () => {
  afterEach(() => sinon.restore());

  it('authenticates and saves credentials on success', async () => {
    sinon.stub(inquirer, 'prompt').resolves({
      origin_url: `${BASE_URL}/some/path?x=1`,
      api_access_token: '  token-abc  ',
    });
    // Stubbed, not spied: Auth.save's real implementation writes to the developer's
    // actual ~/.tooljet/credentials.json (its path is fixed at module-load time, so
    // no per-test home-dir override reaches it) — see test/lib/auth.test.ts for
    // coverage of the real file-writing behavior in full isolation.
    const saveStub = sinon.stub(Auth, 'save');

    nock(BASE_URL)
      .get('/api/personal-access-tokens/validate')
      .reply(200, { email: 'me@example.com', organizationId: 'org-1' });

    const result = await runCommand(Login);

    expect(result.exitCode).to.be.undefined;
    expect(result.stdout).to.include('Authenticated as me@example.com');
    // Origin is normalized to protocol+host+port, dropping path/query/fragment,
    // and the token is trimmed.
    expect(saveStub.calledWith('org-1', BASE_URL, 'token-abc', 'me@example.com')).to.be.true;
  });

  it('exits 1 and does not save credentials when the API rejects the token', async () => {
    sinon.stub(inquirer, 'prompt').resolves({
      origin_url: BASE_URL,
      api_access_token: 'bad-token',
    });
    const saveStub = sinon.stub(Auth, 'save');

    nock(BASE_URL)
      .get('/api/personal-access-tokens/validate')
      .reply(401, { statusCode: 401, message: 'Invalid CLI token' });

    const result = await runCommand(Login);

    expect(result.exitCode).to.equal(1);
    expect(result.stdout).to.include('Invalid CLI token');
    expect(saveStub.called).to.be.false;
  });
});
