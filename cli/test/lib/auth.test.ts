import { expect } from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { mock } from 'node:test';

// `Auth`'s CREDENTIALS_PATH (~/.tooljet/credentials.json) is computed once, at
// module-load time, from os.homedir() — it is NOT re-read per call. A previous
// version of this test stubbed process.env.HOME/os.homedir() *after* some other
// test file had already required `Auth` (module instances are cached by Node),
// so the stub had no effect and Auth.save() silently wrote to the real
// ~/.tooljet/credentials.json on the machine running the tests.
//
// To truly isolate this, `os.homedir()` must be mocked *before* a fresh copy of
// the auth module is required, on every single test — so each test below busts
// the require cache for auth.ts and re-requires it after mocking os.homedir().
const AUTH_MODULE_PATH = require.resolve('../../src/lib/library/auth');

function loadIsolatedAuth(homeDir: string): typeof import('../../src/lib/library/auth')['Auth'] {
  mock.method(os, 'homedir', () => homeDir);
  delete require.cache[AUTH_MODULE_PATH];
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return (require(AUTH_MODULE_PATH) as typeof import('../../src/lib/library/auth')).Auth;
}

function credentialsPath(home: string): string {
  return path.join(home, '.tooljet', 'credentials.json');
}

describe('Auth', () => {
  let homeDir: string;

  beforeEach(() => {
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-cli-home-'));
  });

  afterEach(() => {
    mock.restoreAll();
    delete require.cache[AUTH_MODULE_PATH]; // don't leak a homedir-mocked instance into later tests
    fs.rmSync(homeDir, { recursive: true, force: true });
  });

  describe('save', () => {
    it('creates ~/.tooljet/credentials.json with mode 0600', () => {
      const Auth = loadIsolatedAuth(homeDir);

      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-abc', 'me@example.com');

      const filePath = credentialsPath(homeDir);
      expect(fs.existsSync(filePath)).to.be.true;

      const stored = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(stored).to.deep.equal({
        workspaces: { 'ws-1': { url: 'https://app.tooljet.ai', apiToken: 'token-abc', email: 'me@example.com' } },
        default: 'ws-1',
      });

      const mode = fs.statSync(filePath).mode & 0o777;
      expect(mode).to.equal(0o600);
    });

    it('re-chmods a pre-existing credentials file to 0600', () => {
      const Auth = loadIsolatedAuth(homeDir);

      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-abc', 'me@example.com');
      fs.chmodSync(credentialsPath(homeDir), 0o644);

      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-def', 'me@example.com');

      const mode = fs.statSync(credentialsPath(homeDir)).mode & 0o777;
      expect(mode).to.equal(0o600);
    });

    it('merges multiple workspaces and updates the default to the most recently saved one', () => {
      const Auth = loadIsolatedAuth(homeDir);

      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-1', 'a@example.com');
      Auth.save('ws-2', 'https://other.tooljet.ai', 'token-2', 'b@example.com');

      const stored = JSON.parse(fs.readFileSync(credentialsPath(homeDir), 'utf8'));
      expect(Object.keys(stored.workspaces)).to.have.members(['ws-1', 'ws-2']);
      expect(stored.default).to.equal('ws-2');
    });

    it('overwrites the stored url/token/email when the same workspace is saved again', () => {
      const Auth = loadIsolatedAuth(homeDir);

      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-old', 'old@example.com');
      Auth.save('ws-1', 'https://new.tooljet.ai', 'token-new', 'new@example.com');

      const stored = JSON.parse(fs.readFileSync(credentialsPath(homeDir), 'utf8'));
      expect(Object.keys(stored.workspaces)).to.deep.equal(['ws-1']);
      expect(stored.workspaces['ws-1']).to.deep.equal({
        url: 'https://new.tooljet.ai',
        apiToken: 'token-new',
        email: 'new@example.com',
      });
    });

    it('re-saving a non-default workspace makes it the new default', () => {
      const Auth = loadIsolatedAuth(homeDir);

      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-1', 'a@example.com');
      Auth.save('ws-2', 'https://other.tooljet.ai', 'token-2', 'b@example.com');
      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-1', 'a@example.com');

      const stored = JSON.parse(fs.readFileSync(credentialsPath(homeDir), 'utf8'));
      expect(stored.default).to.equal('ws-1');
    });
  });

  describe('resolve', () => {
    it('throws when no credentials are stored', () => {
      const Auth = loadIsolatedAuth(homeDir);

      expect(() => Auth.resolve()).to.throw(/Not authenticated/);
    });

    it('resolves the default workspace from stored credentials', () => {
      const Auth = loadIsolatedAuth(homeDir);
      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-abc', 'me@example.com');

      const resolved = Auth.resolve();

      expect(resolved).to.deep.equal({ workspaceId: 'ws-1', apiToken: 'token-abc', url: 'https://app.tooljet.ai' });
    });

    it('lets --url/--token flags override stored values while keeping the stored workspaceId', () => {
      const Auth = loadIsolatedAuth(homeDir);
      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-abc', 'me@example.com');

      const resolved = Auth.resolve({ url: 'http://localhost:3000', token: 'override-token' });

      expect(resolved).to.deep.equal({ workspaceId: 'ws-1', apiToken: 'override-token', url: 'http://localhost:3000' });
    });

    it('resolves a specific stored workspaceId rather than the default', () => {
      const Auth = loadIsolatedAuth(homeDir);
      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-1', 'a@example.com');
      Auth.save('ws-2', 'https://other.tooljet.ai', 'token-2', 'b@example.com');

      // ws-2 is the default after the second save, so asking for ws-1 proves the
      // workspaceId flag is honoured instead of silently falling back.
      const resolved = Auth.resolve({ workspaceId: 'ws-1' });

      expect(resolved).to.deep.equal({
        workspaceId: 'ws-1',
        apiToken: 'token-1',
        url: 'https://app.tooljet.ai',
      });
    });

    it('throws when a specific workspaceId flag is requested but not stored', () => {
      const Auth = loadIsolatedAuth(homeDir);
      Auth.save('ws-1', 'https://app.tooljet.ai', 'token-abc', 'me@example.com');

      expect(() => Auth.resolve({ workspaceId: 'ws-unknown' })).to.throw(/ws-unknown/);
    });
  });

  describe('resolveOrExit', () => {
    it('logs the error and exits 1 when not authenticated', () => {
      const Auth = loadIsolatedAuth(homeDir);
      mock.method(process, 'exit', () => {
        throw new Error('EXIT_1');
      });
      mock.method(console, 'log', () => {});

      expect(() => Auth.resolveOrExit()).to.throw('EXIT_1');
    });
  });
});
