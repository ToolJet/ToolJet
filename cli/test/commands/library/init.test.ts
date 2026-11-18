import nock = require('nock');
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';
import { mock } from 'node:test';

import ComponentInit from '../../../src/commands/library/init';
import { Auth } from '../../../src/lib/library/auth';
import * as scaffolder from '../../../src/lib/library/scaffolder';
import { runCommand } from '../../helpers/run-command';
import { withTempCwd } from '../../helpers/fixtures';

const BASE_URL = 'https://app.tooljet.test';

describe('library init', () => {
  const cwd = withTempCwd();
  let scaffoldMock: ReturnType<typeof mock.method>;

  afterEach(() => mock.restoreAll());

  beforeEach(() => {
    mock.method(Auth, 'resolveOrExit', () => ({
      workspaceId: 'org-1',
      apiToken: 'token-abc',
      url: BASE_URL,
    }));
    mock.method(inquirer, 'prompt', async () => ({ display_name: 'My Library' }));
    // scaffoldTemplate shells out to Hygen; mock it to just create the directory,
    // mirroring what the real template does without invoking Hygen for real.
    scaffoldMock = mock.method(scaffolder, 'scaffoldTemplate', async (name: string) => {
      fs.mkdirSync(name, { recursive: true });
    });
  });

  describe('display name validation', () => {
    // The validator is supplied to inquirer as part of the question, so it's pulled
    // off the recorded prompt call rather than driven through a real prompt.
    async function displayNameValidator(): Promise<(input: string) => string | boolean> {
      const promptMock = mock.method(inquirer, 'prompt', async () => ({ display_name: 'My Library' }));
      nock(BASE_URL)
        .post('/api/custom-component-libraries', { name: 'My Library' })
        .reply(201, { id: 'id-1', name: 'My Library', correlationId: 'corr-1' });

      await runCommand(ComponentInit, ['my-lib']);

      const [[question]] = promptMock.mock.calls[0].arguments as [{ validate: (i: string) => string | boolean }[]];
      return question.validate;
    }

    it('requires a non-empty name', async () => {
      const validate = await displayNameValidator();

      expect(validate('')).to.equal('Display name is required');
      expect(validate('   ')).to.equal('Display name is required');
    });

    it('accepts letters, numbers, spaces, hyphens and underscores', async () => {
      const validate = await displayNameValidator();

      expect(validate('My Library 2')).to.be.true;
      expect(validate('my-library_v2')).to.be.true;
      expect(validate('  Padded Name  ')).to.be.true;
    });

    it('requires the name to start with a letter', async () => {
      const validate = await displayNameValidator();

      for (const name of ['2Fast', '-leading-hyphen', '_leading_underscore', ' 9lives']) {
        expect(validate(name), name).to.match(/must start with a letter/);
      }
    });

    it('rejects every other special character', async () => {
      const validate = await displayNameValidator();

      for (const name of ['My.Library', 'My/Library', 'My@Library', 'My+Library', 'Lib (v2)', 'Lib!']) {
        expect(validate(name), name).to.match(/must start with a letter/);
      }
    });

    it('rejects a name longer than 100 characters, counted after trimming', async () => {
      const validate = await displayNameValidator();

      expect(validate('a'.repeat(100))).to.be.true;
      expect(validate('a'.repeat(101))).to.equal('Display name must be 100 characters or less');
      // Surrounding whitespace is trimmed before the length is measured.
      expect(validate(`  ${'a'.repeat(100)}  `)).to.be.true;
    });

    it('reports the length problem before the character-set problem', async () => {
      const validate = await displayNameValidator();

      // A too-long name made of invalid characters should surface the length message,
      // which is the more specific of the two.
      expect(validate('@'.repeat(101))).to.equal('Display name must be 100 characters or less');
    });
  });

  // Library names are unique per workspace, but the CLI has no local list to check
  // against — the server rejects the duplicate and init surfaces it, rolling back
  // the directory it had already scaffolded.
  it('surfaces a duplicate-name rejection from the server and rolls back', async () => {
    nock(BASE_URL)
      .post('/api/custom-component-libraries', { name: 'My Library' })
      .reply(409, { message: 'A library named "My Library" already exists in this workspace' });

    const result = await runCommand(ComponentInit, ['my-lib']);

    expect(result.exitCode).to.equal(1);
    expect(result.stdout).to.include('already exists in this workspace');
    expect(fs.existsSync('my-lib')).to.be.false;
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
    scaffoldMock.mock.restore();
    mock.method(scaffolder, 'scaffoldTemplate', async () => {
      throw new Error('hygen exploded');
    });

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

    mock.method(scaffolder, 'writeLibraryConfig', () => {
      throw new Error('disk full');
    });

    const result = await runCommand(ComponentInit, ['my-lib']);

    expect(result.exitCode).to.equal(1);
    expect(result.stdout).to.include('was registered on org-1');
    expect(result.stdout).to.include('disk full');
    expect(fs.existsSync('my-lib')).to.be.true;
  });
});
