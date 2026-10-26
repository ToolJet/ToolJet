import { GITConnectionType } from '@entities/organization_git_sync.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { OrganizationGitLab } from '@entities/gitsync_entities/organization_gitlab.entity';

type ProviderRelationKey = 'gitHttps' | 'gitLab';
type ProviderRow = OrganizationGitHttps | OrganizationGitLab;

/**
 * Data-only description of where each git provider keeps its config on OrganizationGitSync. This is
 * the SINGLE registration point for per-provider config-field mapping: it replaces the ~10 duplicated
 * `switch (gitType)` / `if (orgGit.gitX?.isEnabled)` blocks that used to live across the repository
 * and the config services. Adding a provider (e.g. Bitbucket) = add one entry here (plus its
 * dispatcher adapter + entity); no edits to the code that consumes these descriptors.
 *
 * Both the CE repository and the EE services import this, so it lives in CE and holds only data
 * (relation key, entity class, field names) — no EE/provider-service coupling.
 *
 * Array order defines the "first configured provider wins" priority (HTTPS → GitLab today).
 */
export interface GitProviderConfigDescriptor {
  gitType: GITConnectionType;
  relationKey: ProviderRelationKey;
  entity: new () => ProviderRow;
  repoUrlField: string;
  branchField: string;
  secretField: string;
}

export const GIT_PROVIDER_CONFIG_DESCRIPTORS: readonly GitProviderConfigDescriptor[] = [
  {
    gitType: GITConnectionType.GITHUB_HTTPS,
    relationKey: 'gitHttps',
    entity: OrganizationGitHttps,
    repoUrlField: 'httpsUrl',
    branchField: 'githubBranch',
    secretField: 'githubPrivateKey',
  },
  {
    gitType: GITConnectionType.GITLAB,
    relationKey: 'gitLab',
    entity: OrganizationGitLab,
    repoUrlField: 'gitlabUrl',
    branchField: 'gitlabBranch',
    secretField: 'gitlabProjectAccessToken',
  },
];

/** Descriptor for a given gitType, or undefined when unknown. */
export function getProviderDescriptor(gitType?: string | null): GitProviderConfigDescriptor | undefined {
  return GIT_PROVIDER_CONFIG_DESCRIPTORS.find((d) => d.gitType === gitType);
}

/** The provider row for a gitType on an orgGit (e.g. orgGit.gitHttps), or null. */
export function getProviderRow(orgGit: OrganizationGitSync, gitType: string): ProviderRow | null {
  const d = getProviderDescriptor(gitType);
  return (d && ((orgGit as any)?.[d.relationKey] as ProviderRow)) || null;
}

/** repoUrl + defaultBranch for a gitType, read via the descriptor's field names. */
export function getProviderRepoDetails(
  orgGit: OrganizationGitSync,
  gitType: string
): { repoUrl: string | null; defaultGitBranch: string | null } {
  const d = getProviderDescriptor(gitType);
  const row: any = d ? (orgGit as any)?.[d.relationKey] : null;
  return {
    repoUrl: row?.[d!.repoUrlField] ?? null,
    defaultGitBranch: row?.[d!.branchField] ?? null,
  };
}

/** First descriptor whose relation is present on orgGit (config exists), by priority order. */
export function resolveConfiguredDescriptor(
  orgGit: OrganizationGitSync,
  opts: { requireEnabled?: boolean } = {}
): GitProviderConfigDescriptor | undefined {
  return GIT_PROVIDER_CONFIG_DESCRIPTORS.find((d) => {
    const row: any = (orgGit as any)?.[d.relationKey];
    return opts.requireEnabled ? !!row?.isEnabled : !!row;
  });
}
