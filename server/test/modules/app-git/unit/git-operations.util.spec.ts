/**
 * GitOperationsUtil — the provider-agnostic simple-git wrapper (clone / sparseClone /
 * commit / push / branchExists / resolveTagToSha).
 *
 * Pure command-shaping logic: `simple-git` and `fs` are mocked, so no repo / network is
 * touched. We assert the exact argv handed to git and the control flow (clean-existing,
 * skip-empty commit, url-swap on push + the finally-unset, tag local→fetch fallback).
 *
 * @group gitsync
 */
let mockGit: any;
const mockSimpleGit = jest.fn(() => mockGit);

jest.mock('simple-git', () => ({ __esModule: true, default: (...args: any[]) => mockSimpleGit(...args) }));
jest.mock('fs', () => ({ existsSync: jest.fn(), rmSync: jest.fn() }));

import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';
import { GitOperationsUtil } from '@ee/app-git/shared/git-operations.util';

const existsSync = fs.existsSync as unknown as jest.Mock;
const rmSync = fs.rmSync as unknown as jest.Mock;

describe('GitOperationsUtil', () => {
  let util: GitOperationsUtil;
  let logger: { log: jest.Mock };

  const freshGit = () => ({
    clone: jest.fn().mockResolvedValue(undefined),
    env: jest.fn(),
    raw: jest.fn().mockResolvedValue(''),
    listRemote: jest.fn().mockResolvedValue(''),
    status: jest.fn().mockResolvedValue({ files: [] }),
    addConfig: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    remote: jest.fn().mockResolvedValue(undefined),
    push: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(() => {
    mockGit = freshGit();
    mockSimpleGit.mockClear();
    existsSync.mockReset();
    rmSync.mockReset();
    logger = { log: jest.fn() };
    util = new GitOperationsUtil(logger as any);
  });

  describe('createGit', () => {
    it('builds a simple-git instance with the default 60s block timeout', () => {
      util.createGit('/repo');
      expect(mockSimpleGit).toHaveBeenCalledWith('/repo', { timeout: { block: 60000 } });
    });
    it('honours a custom timeout', () => {
      util.createGit('/repo', 5000);
      expect(mockSimpleGit).toHaveBeenCalledWith('/repo', { timeout: { block: 5000 } });
    });
  });

  describe('clone', () => {
    it('assembles depth + single-branch + branch argv by default', async () => {
      await util.clone('/target', 'https://host/r.git', 'main');
      expect(mockGit.clone).toHaveBeenCalledWith('https://host/r.git', '/target', [
        '--depth',
        '1',
        '--single-branch',
        '--branch',
        'main',
      ]);
    });

    it('prepends sslVerify + appends credential-helper suppression when requested', async () => {
      await util.clone('/target', 'url', 'dev', { sslDisabled: true, disableCredentialHelper: true, depth: 5 });
      expect(mockGit.clone).toHaveBeenCalledWith('url', '/target', [
        '-c',
        'http.sslVerify=false',
        '--depth',
        '5',
        '--single-branch',
        '--branch',
        'dev',
        '-c',
        'credential.helper=',
      ]);
    });

    it('omits --single-branch only when singleBranch is explicitly false', async () => {
      await util.clone('/target', 'url', 'main', { singleBranch: false });
      expect(mockGit.clone.mock.calls[0][2]).not.toContain('--single-branch');
    });

    it('cleans an existing target dir first when cleanExisting is set', async () => {
      existsSync.mockReturnValue(true);
      await util.clone('/target', 'url', 'main', { cleanExisting: true });
      expect(rmSync).toHaveBeenCalledWith('/target', { recursive: true, force: true });
    });

    it('does not rm when the target does not exist', async () => {
      existsSync.mockReturnValue(false);
      await util.clone('/target', 'url', 'main', { cleanExisting: true });
      expect(rmSync).not.toHaveBeenCalled();
    });

    it('injects the SSH env when provided', async () => {
      await util.clone('/target', 'url', 'main', { env: { GIT_SSH_COMMAND: 'ssh -i key' } });
      expect(mockGit.env).toHaveBeenCalledWith({ GIT_SSH_COMMAND: 'ssh -i key' });
    });

    it('wraps a clone failure in a BadRequestException and logs it', async () => {
      mockGit.clone.mockRejectedValue(new Error('auth failed'));
      await expect(util.clone('/target', 'url', 'main')).rejects.toBeInstanceOf(BadRequestException);
      expect(logger.log).toHaveBeenCalled();
    });
  });

  describe('branchExists', () => {
    it('returns true when ls-remote yields a ref line', async () => {
      mockGit.listRemote.mockResolvedValue('deadbeef\trefs/heads/main\n');
      await expect(util.branchExists('url', 'main')).resolves.toBe(true);
      expect(mockGit.listRemote).toHaveBeenCalledWith(['--heads', 'url', 'main']);
    });
    it('returns false when the remote has no such ref', async () => {
      mockGit.listRemote.mockResolvedValue('   \n');
      await expect(util.branchExists('url', 'gone')).resolves.toBe(false);
    });
    it('rethrows (and logs) on a git error', async () => {
      mockGit.listRemote.mockRejectedValue(new Error('network'));
      await expect(util.branchExists('url', 'main')).rejects.toThrow('network');
      expect(logger.log).toHaveBeenCalled();
    });
  });

  describe('commit', () => {
    const user = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@tooljet.io' } as any;

    it('skips entirely when there are no staged changes (skipEmpty default)', async () => {
      mockGit.status.mockResolvedValue({ files: [] });
      await util.commit('/repo', { message: 'noop', user });
      expect(mockGit.commit).not.toHaveBeenCalled();
      expect(mockGit.add).not.toHaveBeenCalled();
    });

    it('sets local identity, stages, and commits when there are changes', async () => {
      mockGit.status.mockResolvedValue({ files: [{ path: 'a' }] });
      await util.commit('/repo', { message: 'feat: x', user });
      expect(mockGit.addConfig).toHaveBeenCalledWith('user.name', 'Ada Lovelace', false, 'local');
      expect(mockGit.addConfig).toHaveBeenCalledWith('user.email', 'ada@tooljet.io', false, 'local');
      expect(mockGit.add).toHaveBeenCalledWith('.');
      expect(mockGit.commit).toHaveBeenCalledWith('feat: x');
      // identity is unset again in finally
      expect(mockGit.raw).toHaveBeenCalledWith(['config', '--unset', 'user.name']);
      expect(mockGit.raw).toHaveBeenCalledWith(['config', '--unset', 'user.email']);
    });

    it('commits even on an empty tree when skipEmpty is false', async () => {
      mockGit.status.mockResolvedValue({ files: [] });
      await util.commit('/repo', { message: 'empty', user, skipEmpty: false });
      expect(mockGit.commit).toHaveBeenCalledWith('empty');
    });

    it('retries add+commit once on a transient index-lock error', async () => {
      mockGit.status.mockResolvedValue({ files: [{ path: 'a' }] });
      mockGit.commit.mockRejectedValueOnce(new Error('index.lock')).mockResolvedValueOnce(undefined);
      await util.commit('/repo', { message: 'retry', user });
      expect(mockGit.add).toHaveBeenCalledTimes(2);
      expect(mockGit.commit).toHaveBeenCalledTimes(2);
    });
  });

  describe('resolveTagToSha', () => {
    it('returns the local rev-parse result without fetching when present', async () => {
      mockGit.raw.mockImplementation((args: string[]) =>
        args[0] === 'rev-parse' ? Promise.resolve('abc123\n') : Promise.reject(new Error('unexpected'))
      );
      await expect(util.resolveTagToSha('/repo', 'mod/v1')).resolves.toBe('abc123');
      expect(mockGit.raw).toHaveBeenCalledWith(['rev-parse', 'refs/tags/mod/v1^{commit}']);
      expect(mockGit.raw).toHaveBeenCalledTimes(1); // no fetch
    });

    it('fetches the specific tag then re-resolves when the local rev-parse misses', async () => {
      let revParseCalls = 0;
      mockGit.raw.mockImplementation((args: string[]) => {
        if (args[0] === 'rev-parse') {
          revParseCalls += 1;
          return revParseCalls === 1 ? Promise.reject(new Error('missing')) : Promise.resolve('def456\n');
        }
        return Promise.resolve(''); // the fetch
      });
      await expect(util.resolveTagToSha('/repo', 'mod/v2')).resolves.toBe('def456');
      expect(mockGit.raw).toHaveBeenCalledWith(['fetch', 'origin', 'refs/tags/mod/v2:refs/tags/mod/v2']);
    });

    it('prepends caller authArgs to the fetch', async () => {
      mockGit.raw.mockImplementation((args: string[]) =>
        args.includes('rev-parse') ? Promise.reject(new Error('missing')) : Promise.resolve('')
      );
      await util.resolveTagToSha('/repo', 'mod/v3', ['-c', 'http.extraheader=AUTH']);
      expect(mockGit.raw).toHaveBeenCalledWith([
        '-c',
        'http.extraheader=AUTH',
        'fetch',
        'origin',
        'refs/tags/mod/v3:refs/tags/mod/v3',
      ]);
    });

    it('returns null when the fetch fails (tag absent on remote)', async () => {
      mockGit.raw.mockImplementation((args: string[]) =>
        args[0] === 'rev-parse' ? Promise.reject(new Error('missing')) : Promise.reject(new Error('fetch failed'))
      );
      await expect(util.resolveTagToSha('/repo', 'ghost/v9')).resolves.toBeNull();
    });
  });

  describe('push', () => {
    it('swaps the remote url before pushing and resets it after', async () => {
      await util.push('/repo', 'main', 'origin', {
        remoteUrl: 'https://tok@host/r.git',
        resetUrl: 'https://host/r.git',
      });
      expect(mockGit.remote).toHaveBeenNthCalledWith(1, ['set-url', 'origin', 'https://tok@host/r.git']);
      expect(mockGit.push).toHaveBeenCalledWith('origin', 'main');
      expect(mockGit.remote).toHaveBeenNthCalledWith(2, ['set-url', 'origin', 'https://host/r.git']);
    });

    it('suppresses ssl verify + credential helper and unsets both in finally', async () => {
      await util.push('/repo', 'main', 'origin', { sslDisabled: true, disableCredentialHelper: true });
      expect(mockGit.addConfig).toHaveBeenCalledWith('credential.helper', '', false, 'local');
      expect(mockGit.addConfig).toHaveBeenCalledWith('http.sslVerify', 'false', false, 'global');
      expect(mockGit.raw).toHaveBeenCalledWith(['config', '--global', '--unset', 'http.sslVerify']);
      expect(mockGit.raw).toHaveBeenCalledWith(['config', '--local', '--unset', 'credential.helper']);
    });

    it('rethrows on push failure but still runs the finally cleanup', async () => {
      mockGit.push.mockRejectedValue(new Error('rejected by remote'));
      await expect(util.push('/repo', 'main', 'origin', { sslDisabled: true })).rejects.toThrow('rejected by remote');
      expect(logger.log).toHaveBeenCalled();
      expect(mockGit.raw).toHaveBeenCalledWith(['config', '--global', '--unset', 'http.sslVerify']);
    });
  });

  describe('sparseClone', () => {
    it('clones blobless+sparse then cones to the app folder + workspace dirs', async () => {
      existsSync.mockReturnValue(false);
      await util.sparseClone('/target', 'https://tok@host/r.git', 'main', 'My App');

      expect(mockGit.clone).toHaveBeenCalledWith('https://tok@host/r.git', '/target', [
        '--filter=blob:none',
        '--sparse',
        '--depth',
        '1',
        '--no-checkout',
        '-b',
        'main',
        '-c',
        'credential.helper=',
      ]);
      expect(mockGit.raw).toHaveBeenCalledWith(['sparse-checkout', 'init', '--cone']);
      expect(mockGit.raw).toHaveBeenCalledWith(['sparse-checkout', 'set', 'apps/My App', 'data-sources', '.meta']);
      expect(mockGit.raw).toHaveBeenCalledWith(['checkout', 'main']);
    });

    it('rm -rf the target dir first when it already exists', async () => {
      existsSync.mockReturnValue(true);
      await util.sparseClone('/target', 'url', 'main', 'App');
      expect(rmSync).toHaveBeenCalledWith('/target', { recursive: true, force: true });
    });

    it('prepends -c http.sslVerify=false when sslDisabled', async () => {
      existsSync.mockReturnValue(false);
      await util.sparseClone('/target', 'url', 'main', 'App', { sslDisabled: true });
      expect(mockGit.clone.mock.calls[0][2].slice(0, 2)).toEqual(['-c', 'http.sslVerify=false']);
    });
  });
});
