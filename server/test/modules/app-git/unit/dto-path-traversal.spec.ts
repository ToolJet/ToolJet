import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AppGitPushDto, AppGitPullDto, AppGitPullUpdateDto } from '@modules/app-git/dto';

// gitAppName / gitVersionName are joined into the git clone path, so they must reject path
// separators and parent-directory traversal.
function errorsFor(cls: any, payload: Record<string, unknown>): string[] {
  return validateSync(plainToInstance(cls, payload)).map((e) => e.property);
}

describe('app-git DTOs | path-traversal validation', () => {
  const base = { gitAppName: 'my-app', versionId: 'v', lastCommitMessage: 'm', gitVersionName: 'v1' };

  describe('AppGitPushDto', () => {
    it('accepts plain names', () => {
      expect(errorsFor(AppGitPushDto, base)).toEqual([]);
    });

    it.each([
      ['gitAppName', { ...base, gitAppName: '../../tmp/evil' }],
      ['gitAppName', { ...base, gitAppName: 'a/b' }],
      ['gitAppName', { ...base, gitAppName: 'a\\b' }],
      ['gitVersionName', { ...base, gitVersionName: '../x' }],
    ])('rejects %s containing a path separator or ..', (field, payload) => {
      expect(errorsFor(AppGitPushDto, payload)).toContain(field);
    });
  });

  describe('AppGitPullDto', () => {
    it('accepts an omitted (optional) gitAppName', () => {
      expect(errorsFor(AppGitPullDto, { gitAppId: 'x' })).toEqual([]);
    });

    it('rejects a traversal gitAppName when present', () => {
      expect(errorsFor(AppGitPullDto, { gitAppName: '../../etc' })).toContain('gitAppName');
    });
  });

  describe('AppGitPullUpdateDto', () => {
    it('rejects a traversal gitVersionName when present', () => {
      expect(errorsFor(AppGitPullUpdateDto, { gitVersionName: '..\\..\\x' })).toContain('gitVersionName');
    });
  });
});
