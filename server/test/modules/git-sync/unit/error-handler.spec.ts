/** @group gitsync */
import { ErrorHandler } from '@ee/git-sync/error-handler/error-handler';
import { GitErrorMessages } from '@modules/git-sync/error-constants/gitsync_error.constant';

describe('ErrorHandler', () => {
  describe('individual handlers return the mapped constants', () => {
    it('handleInvalidPrivateKeyError', () => {
      expect(ErrorHandler.handleInvalidPrivateKeyError()).toBe(GitErrorMessages.INVALID_PRIVATE_KEY);
    });
    it('handleInvalidBranchNameError', () => {
      expect(ErrorHandler.handleInvalidBranchNameError()).toBe(GitErrorMessages.INVALID_BRANCH_NAME);
    });
    it('handleGithubEnterpriseInvalidUrlFormatError', () => {
      expect(ErrorHandler.handleGithubEnterpriseInvalidUrlFormatError()).toBe(
        GitErrorMessages.GITHUB_ENTERPRISE_INVALID_URL_FORMAT
      );
    });
    it('handleGenericError', () => {
      expect(ErrorHandler.handleGenericError()).toContain('confirm the Github configurations');
    });
  });

  describe('handleGitConnectionError routes by error message', () => {
    it('maps private-key errors (secretOrPrivateKey / private key / PEM / RS256) → INVALID_PRIVATE_KEY', () => {
      for (const msg of ['secretOrPrivateKey must be set', 'invalid private key', 'bad PEM data', 'RS256 mismatch']) {
        expect(ErrorHandler.handleGitConnectionError(new Error(msg))).toBe(GitErrorMessages.INVALID_PRIVATE_KEY);
      }
    });
    it('passes through a "Github URL" error message verbatim', () => {
      const err = new Error('Please check the Github URL and try again!');
      expect(ErrorHandler.handleGitConnectionError(err)).toBe(err.message);
    });
    it('maps "Branch not found" → INVALID_BRANCH_NAME', () => {
      expect(ErrorHandler.handleGitConnectionError(new Error("Branch not found. The branch 'x' does not exist"))).toBe(
        GitErrorMessages.INVALID_BRANCH_NAME
      );
    });
    it('maps "point to the same server" → GITHUB_ENTERPRISE_INVALID_URL_FORMAT', () => {
      expect(
        ErrorHandler.handleGitConnectionError(new Error('Enterprise URL and API URL must point to the same server'))
      ).toBe(GitErrorMessages.GITHUB_ENTERPRISE_INVALID_URL_FORMAT);
    });
    it('falls back to the generic message for anything else', () => {
      expect(ErrorHandler.handleGitConnectionError(new Error('some other failure'))).toContain(
        'confirm the Github configurations'
      );
    });
  });
});
