import { buildGitPrUrl } from '../gitPrUrl';

describe('buildGitPrUrl', () => {
  describe('GitHub', () => {
    it('builds a compare URL from an https repo URL', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'https://github.com/acme/widgets.git',
          gitType: 'github_https',
          sourceBranch: 'feature-x',
          defaultBranch: 'main',
        })
      ).toBe('https://github.com/acme/widgets/compare/main...feature-x?expand=1');
    });

    it('parses an ssh-style URL and a dotted repo name', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'git@github.com:acme/git-sync-2.0-repo.git',
          gitType: 'github_https',
          sourceBranch: 'feat',
          defaultBranch: 'master',
        })
      ).toBe('https://github.com/acme/git-sync-2.0-repo/compare/master...feat?expand=1');
    });

    // Regression: GitHub Enterprise hosts don't contain the literal "github.com", so host-only
    // detection produced no URL. gitType is authoritative, so the enterprise host now resolves.
    it('builds a compare URL for a self-hosted GitHub Enterprise host', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'https://github.company.com/team/app.git',
          gitType: 'github_https',
          sourceBranch: 'feature-x',
          defaultBranch: 'main',
        })
      ).toBe('https://github.company.com/team/app/compare/main...feature-x?expand=1');
    });

    it('converts an scp-style Enterprise remote to an https base', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'git@github.company.com:team/app.git',
          gitType: 'github_https',
          sourceBranch: 'feature-x',
          defaultBranch: 'main',
        })
      ).toBe('https://github.company.com/team/app/compare/main...feature-x?expand=1');
    });
  });

  describe('GitLab', () => {
    // Regression: a GitLab workspace produced no URL ("Unable to determine repository URL for PR
    // creation") because the header dropdown only read the GitHub repo URL. With a GitLab repo URL
    // it must now produce a merge-request link.
    it('builds a merge_request URL for gitlab.com', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'https://gitlab.com/vamshi31/tj-gitsync-1',
          gitType: 'gitlab',
          sourceBranch: 'branch-1',
          defaultBranch: 'main',
        })
      ).toBe(
        'https://gitlab.com/vamshi31/tj-gitsync-1/-/merge_requests/new' +
          '?merge_request[source_branch]=branch-1&merge_request[target_branch]=main'
      );
    });

    it('encodes branch names containing slashes', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'https://gitlab.com/acme/widgets',
          gitType: 'gitlab',
          sourceBranch: 'feat/login',
          defaultBranch: 'release/1.0',
        })
      ).toBe(
        'https://gitlab.com/acme/widgets/-/merge_requests/new' +
          '?merge_request[source_branch]=feat%2Flogin&merge_request[target_branch]=release%2F1.0'
      );
    });

    it('uses the configured repo URL as the base for self-hosted GitLab (host != gitlab.com)', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'https://git.internal.example.com/team/app.git',
          gitType: 'gitlab',
          sourceBranch: 'branch-1',
          defaultBranch: 'main',
        })
      ).toBe(
        'https://git.internal.example.com/team/app/-/merge_requests/new' +
          '?merge_request[source_branch]=branch-1&merge_request[target_branch]=main'
      );
    });
  });

  describe('Bitbucket', () => {
    it('builds a pull-requests URL', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'https://bitbucket.org/acme/widgets.git',
          gitType: 'bitbucket',
          sourceBranch: 'feature-x',
          defaultBranch: 'main',
        })
      ).toBe('https://bitbucket.org/acme/widgets/pull-requests/new?source=feature-x&dest=main');
    });
  });

  describe('guards', () => {
    it('returns null when the repo URL is empty (the reported failure mode)', () => {
      expect(
        buildGitPrUrl({ repoUrl: '', gitType: 'gitlab', sourceBranch: 'branch-1', defaultBranch: 'main' })
      ).toBeNull();
    });

    it('returns null when the source branch is missing', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'https://gitlab.com/acme/widgets',
          gitType: 'gitlab',
          sourceBranch: undefined,
          defaultBranch: 'main',
        })
      ).toBeNull();
    });

    it('returns null for an unknown host when no gitType is provided', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'https://git.internal.example.com/team/app.git',
          gitType: undefined,
          sourceBranch: 'branch-1',
          defaultBranch: 'main',
        })
      ).toBeNull();
    });

    it('falls back to host detection when no gitType is provided (gitlab.com)', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'https://gitlab.com/acme/widgets',
          gitType: undefined,
          sourceBranch: 'branch-1',
          defaultBranch: 'main',
        })
      ).toBe(
        'https://gitlab.com/acme/widgets/-/merge_requests/new' +
          '?merge_request[source_branch]=branch-1&merge_request[target_branch]=main'
      );
    });

    it('defaults the target branch to main when none is provided', () => {
      expect(
        buildGitPrUrl({
          repoUrl: 'https://gitlab.com/acme/widgets',
          gitType: 'gitlab',
          sourceBranch: 'branch-1',
          defaultBranch: undefined,
        })
      ).toBe(
        'https://gitlab.com/acme/widgets/-/merge_requests/new' +
          '?merge_request[source_branch]=branch-1&merge_request[target_branch]=main'
      );
    });
  });
});
