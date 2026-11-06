import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { mock } from 'node:test';

/*
  A project belongs to the instance it was cloned from, and its commands use that instance's login whatever the
  default login is. Signing in to another instance never moves the default by itself.

  The credentials file's path is fixed when auth.ts loads, from os.homedir(), so each test mocks the home folder and
  loads fresh copies of auth.ts and the modules that hold it (see test/lib/auth.test.ts).
*/

const AUTH = require.resolve('../../../src/lib/library/auth');
const SESSION = require.resolve('../../../src/lib/app/session');
const INSTANCE = require.resolve('../../../src/lib/app/instance');

type AuthModule = typeof import('../../../src/lib/library/auth');
type InstanceModule = typeof import('../../../src/lib/app/instance');

const REAL = 'https://tooljet.acme.test';
const OTHER = 'https://tooljet-acme.attacker.test';
const ENV = ['TOOLJET_URL', 'TOOLJET_PAT', 'TOOLJET_TOKEN', 'TOOLJET_SESSION_TOKEN', 'TOOLJET_WORKSPACE_ID', 'TOOLJET_CLI_SERVER_MODE'];

describe('project instance', () => {
  let home: string;
  let root: string;
  let Auth: AuthModule['Auth'];
  let lib: InstanceModule;
  const savedEnv: Record<string, string | undefined> = {};

  const load = () => {
    for (const m of [AUTH, SESSION, INSTANCE]) delete require.cache[m];
    Auth = (require(AUTH) as AuthModule).Auth;
    lib = require(INSTANCE) as InstanceModule;
  };
  const stored = () => JSON.parse(fs.readFileSync(path.join(home, '.tooljet', 'credentials.json'), 'utf8'));

  beforeEach(() => {
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-home-'));
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'tj-project-'));
    for (const name of ENV) {
      savedEnv[name] = process.env[name];
      delete process.env[name];
    }
    mock.method(os, 'homedir', () => home);
    load();
  });

  afterEach(() => {
    mock.restoreAll();
    for (const m of [AUTH, SESSION, INSTANCE]) delete require.cache[m];
    for (const name of ENV) {
      if (savedEnv[name] === undefined) delete process.env[name];
      else process.env[name] = savedEnv[name];
    }
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe('signing in', () => {
    it('signing in to a second instance keeps the default login, and says so', () => {
      expect(Auth.save('ws-real', REAL, 'real-token', 'me@acme.test')).to.deep.equal({ isDefault: true, defaultUrl: REAL });
      expect(Auth.save('ws-other', OTHER, 'other-token', 'me@acme.test')).to.deep.equal({ isDefault: false, defaultUrl: REAL });
      expect(stored().default).to.equal('ws-real');
      expect(Auth.resolve().url).to.equal(REAL);
      expect(Auth.forOrigin(OTHER)).to.deep.equal({ workspaceId: 'ws-other', apiToken: 'other-token', url: OTHER });
      expect(Auth.forOrigin(REAL)?.apiToken).to.equal('real-token');
    });

    it('--default switches it on purpose; signing in again to the default instance keeps it the default', () => {
      Auth.save('ws-real', REAL, 'real-token', 'me@acme.test');
      expect(Auth.save('ws-other', OTHER, 'other-token', 'me@acme.test', { makeDefault: true }).isDefault).to.equal(true);
      expect(Auth.defaultOrigin()).to.equal(OTHER);
      expect(Auth.save('ws-other-2', OTHER, 'other-token-2', 'me@acme.test').isDefault).to.equal(true);
      expect(stored().default).to.equal('ws-other-2');
      expect(Auth.forOrigin(OTHER)?.workspaceId).to.equal('ws-other-2', 'the last workspace signed in on an instance is its login');
    });

    it('a workspace id another instance already uses is kept apart, never overwriting that login', () => {
      Auth.save('ws-1', REAL, 'real-token', 'me@acme.test');
      Auth.save('ws-1', OTHER, 'other-token', 'me@acme.test');
      const creds = stored();
      expect(creds.default).to.equal('ws-1');
      expect(creds.workspaces['ws-1']).to.deep.equal({ url: REAL, apiToken: 'real-token', email: 'me@acme.test' });
      expect(Auth.resolve().apiToken).to.equal('real-token');
      expect(Auth.forOrigin(OTHER)).to.deep.equal({ workspaceId: 'ws-1', apiToken: 'other-token', url: OTHER });
    });
  });

  describe('the project record', () => {
    it('is written as the origin and read back', () => {
      lib.writeProjectInstance(root, `${REAL}/some/path`);
      expect(JSON.parse(fs.readFileSync(path.join(root, '.tooljet', 'instance.json'), 'utf8'))).to.deep.equal({ url: REAL });
      expect(lib.readProjectInstance(root)).to.equal(REAL);
    });

    it('a project without one has no instance; a broken one is refused, not ignored', () => {
      expect(lib.readProjectInstance(root)).to.equal(undefined);
      fs.mkdirSync(path.join(root, '.tooljet'));
      fs.writeFileSync(path.join(root, '.tooljet', 'instance.json'), '{"url":"http://evil.example.com"}');
      expect(() => lib.readProjectInstance(root)).to.throw(/does not name a ToolJet instance/);
    });
  });

  describe('which login a command uses', () => {
    beforeEach(() => {
      Auth.save('ws-real', REAL, 'real-token', 'me@acme.test');
      Auth.save('ws-other', OTHER, 'other-token', 'me@acme.test');
    });

    it("a project uses its own instance's login, not the default", () => {
      lib.writeProjectInstance(root, OTHER);
      expect(lib.resolveAppTarget({}, root)).to.deep.equal({ url: OTHER, token: 'other-token' });
    });

    it('even when the default has been switched to another instance', () => {
      Auth.save('ws-other', OTHER, 'other-token', 'me@acme.test', { makeDefault: true });
      lib.writeProjectInstance(root, REAL);
      expect(lib.resolveAppTarget({}, root)).to.deep.equal({ url: REAL, token: 'real-token' });
    });

    it('a project with no record uses the default login, as before', () => {
      expect(lib.resolveAppTarget({}, root)).to.deep.equal({ url: REAL, token: 'real-token' });
      expect(lib.resolveAppTarget({})).to.deep.equal({ url: REAL, token: 'real-token' });
    });

    it('refuses when its instance has no login, naming the default and --instance', () => {
      lib.writeProjectInstance(root, 'https://third.acme.test');
      expect(() => lib.resolveAppTarget({}, root)).to.throw(
        'This project belongs to https://third.acme.test, and the CLI is not signed in there. Run: tooljet auth login --url https://third.acme.test (Your default login is https://tooljet.acme.test; to use it for this project anyway, add --instance https://tooljet.acme.test.)'
      );
    });

    it('--instance picks a stored login, in a project or for clone', () => {
      lib.writeProjectInstance(root, REAL);
      expect(lib.resolveAppTarget({ instance: OTHER }, root)).to.deep.equal({ url: OTHER, token: 'other-token' });
      expect(lib.resolveAppTarget({ instance: `${OTHER}/` })).to.deep.equal({ url: OTHER, token: 'other-token' });
      expect(() => lib.resolveAppTarget({ instance: 'https://third.acme.test' })).to.throw(/not signed in to https:\/\/third\.acme\.test/);
      expect(() => lib.resolveAppTarget({ instance: 'http://plain.example.com' })).to.throw(/--instance: HTTP is only allowed/);
    });

    it('refuses --url or TOOLJET_URL naming another instance than the project, unless --instance names it', () => {
      lib.writeProjectInstance(root, REAL);
      expect(() => lib.resolveAppTarget({ url: OTHER, token: 't' }, root)).to.throw(
        `This project belongs to ${REAL}, but --url is ${OTHER}. To run it against ${OTHER} anyway, add --instance ${OTHER}.`
      );
      process.env.TOOLJET_URL = OTHER;
      process.env.TOOLJET_PAT = 't';
      expect(() => lib.resolveAppTarget({}, root)).to.throw(/but TOOLJET_URL is https:\/\/tooljet-acme\.attacker\.test/);
      expect(lib.resolveAppTarget({ instance: OTHER }, root)).to.deep.equal({ url: OTHER, token: 't' });
      expect(() => lib.resolveAppTarget({ instance: REAL }, root)).to.throw(`--instance is ${REAL} but TOOLJET_URL is ${OTHER}.`);
      process.env.TOOLJET_URL = `${REAL}/`;
      expect(lib.resolveAppTarget({}, root)).to.deep.equal({ url: REAL, token: 't' });
    });

    it("a server-mode build's environment is not checked against the record", () => {
      lib.writeProjectInstance(root, REAL);
      process.env.TOOLJET_CLI_SERVER_MODE = '1';
      process.env.TOOLJET_URL = 'http://localhost:3000';
      process.env.TOOLJET_PAT = 't';
      expect(lib.resolveAppTarget({}, root).url).to.equal('http://localhost:3000');
    });

    it("dependency installs ask the project's instance for the SDK", () => {
      expect(lib.projectServer(root)).to.equal(REAL);
      lib.writeProjectInstance(root, OTHER);
      expect(lib.projectServer(root)).to.equal(OTHER);
    });
  });
});
