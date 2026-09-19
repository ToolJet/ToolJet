import nock = require('nock');
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';
import * as sinon from 'sinon';

import ComponentInit from '../../../src/commands/library/init';
import { Auth } from '../../../src/lib/library/auth';
import * as scaffolder from '../../../src/lib/library/scaffolder';
import { runCommand } from '../../helpers/run-command';
import { withTempCwd } from '../../helpers/fixtures';

const BASE_URL = 'https://app.tooljet.test';

describe('library init', () => {
  const cwd = withTempCwd();
  afterEach(() => sinon.restore());

  beforeEach(() => {
    sinon.stub(Auth, 'resolveOrExit').returns({
      workspaceId: 'org-1',
      apiToken: 'token-abc',
      url: BASE_URL,
    });
    sinon.stub(inquirer, 'prompt').resolves({ display_name: 'My Library' });
    // scaffoldTemplate shells out to Hygen; stub it to just create the directory,
    // mirroring what the real template does without invoking Hygen for real.
    sinon.stub(scaffolder, 'scaffoldTemplate').callsFake(async (name: string) => {
      fs.mkdirSync(name, { recursive: true });
    });
  });

  it('rejects a directory name with invalid characters before doing anything else', async () => {
    const result = await runCommand(ComponentInit, ['1-bad-name']);

    expect(result.exitCode).to.equal(1);
    expect(result.stdout).to.include('must start with a letter');
    expect(fs.existsSync('1-bad-name')).to.be.false;
  });

  it('refuses to overwrite an existing directory', async () => {
    fs.mkdirSync(path.join(cwd.get(), 'my-lib'));

    const result = await runCommand(ComponentInit, ['my-lib']);

    expect(result.exitCode).to.equal(1);
    expect(result.stdout).to.include('already exists');
  });

  it('scaffolds locally, registers the library, and writes .tooljet/config.json', async () => {
    nock(BASE_URL)
      .post('/api/custom-component-libraries', { name: 'My Library' })
      .reply(201, { id: 'id-1', name: 'My Library', correlationId: 'corr-1' });

    const result = await runCommand(ComponentInit, ['my-lib']);

    expect(result.exitCode).to.be.undefined;
    expect(fs.existsSync('my-lib')).to.be.true;

    const config = JSON.parse(fs.readFileSync(path.join('my-lib', '.tooljet', 'config.json'), 'utf8'));
    expect(config).to.deep.equal({ libraryName: 'My Library', correlationId: 'corr-1' });
    expect(result.stdout).to.include('Registered library "My Library" on org-1 workspace');
  });

  it('rolls back the scaffolded directory when scaffoldTemplate fails', async () => {
    (scaffolder.scaffoldTemplate as sinon.SinonStub).restore();
    sinon.stub(scaffolder, 'scaffoldTemplate').rejects(new Error('hygen exploded'));

    const result = await runCommand(ComponentInit, ['my-lib']);

    expect(result.exitCode).to.equal(1);
    expect(result.stdout).to.include('hygen exploded');
    expect(fs.existsSync('my-lib')).to.be.false;
  });

  it('rolls back the scaffolded directory when the create-library API call fails', async () => {
    nock(BASE_URL)
      .post('/api/custom-component-libraries', { name: 'My Library' })
      .reply(500, { message: 'Internal error' });

    const result = await runCommand(ComponentInit, ['my-lib']);

    expect(result.exitCode).to.equal(1);
    expect(result.stdout).to.include('Internal error');
    expect(fs.existsSync('my-lib')).to.be.false;
  });

  it('leaves the directory in place if writing .tooljet/config.json fails after a successful registration', async () => {
    nock(BASE_URL)
      .post('/api/custom-component-libraries', { name: 'My Library' })
      .reply(201, { id: 'id-1', name: 'My Library', correlationId: 'corr-1' });

    sinon.stub(scaffolder, 'writeLibraryConfig').throws(new Error('disk full'));

    const result = await runCommand(ComponentInit, ['my-lib']);

    expect(result.exitCode).to.equal(1);
    expect(result.stdout).to.include('was registered on org-1');
    expect(result.stdout).to.include('disk full');
    expect(fs.existsSync('my-lib')).to.be.true;
  });
});
