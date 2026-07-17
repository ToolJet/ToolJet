export const GIT_ENV_KEYS = {
  // Workspace-level branching mode — provider-agnostic (mirrors is_branching_enabled in the
  // git-sync config form). Value is a boolean string ('true' / 'false'); defaults to true
  // (multi-branch). Set to 'false' for single-branch mode.
  BRANCHING_ENABLED: 'GIT_BRANCHING_ENABLED',
  HTTPS: {
    URL: 'GITHUB_URL',
    BRANCH: 'GITHUB_BRANCH',
    APP_ID: 'GITHUB_APP_ID',
    INSTALLATION_ID: 'GITHUB_INSTALLATION_ID',
    PRIVATE_KEY: 'GITHUB_PRIVATE_KEY',
    ENTERPRISE_URL: 'GITHUB_ENTERPRISE_URL', // optional
    ENTERPRISE_API_URL: 'GITHUB_ENTERPRISE_API_URL', // optional
  },
  GITLAB: {
    URL: 'GITLAB_URL',
    BRANCH: 'GITLAB_BRANCH',
    PROJECT_ID: 'GITLAB_PROJECT_ID',
    PROJECT_ACCESS_TOKEN: 'GITLAB_PROJECT_ACCESS_TOKEN',
    ENTERPRISE_URL: 'GITLAB_ENTERPRISE_URL',
  },
} as const;

export const REQUIRED_KEYS = {
  HTTPS: [
    GIT_ENV_KEYS.HTTPS.URL,
    GIT_ENV_KEYS.HTTPS.BRANCH,
    GIT_ENV_KEYS.HTTPS.APP_ID,
    GIT_ENV_KEYS.HTTPS.INSTALLATION_ID,
    GIT_ENV_KEYS.HTTPS.PRIVATE_KEY,
  ],
  GITLAB: [GIT_ENV_KEYS.GITLAB.URL, GIT_ENV_KEYS.GITLAB.BRANCH, GIT_ENV_KEYS.GITLAB.PROJECT_ID],
} as const;

/**
 * Env-config provider descriptors — the SINGLE data registration point for env-var-based git config.
 * Order is the getActiveProvider priority (HTTPS → GitLab). A new provider adds one entry here;
 * the env-registry service scans this list instead of per-provider `if`/`switch` branches, so no edits
 * to that service are needed. (Per-provider config *builders* still map env values → each provider's
 * config shape — those are additive methods, not edits to existing ones.)
 */
export const GIT_ENV_PROVIDER_DESCRIPTORS: ReadonlyArray<{
  provider: string;
  envKeys: readonly string[];
  requiredKeys: readonly string[];
}> = [
  { provider: 'github_https', envKeys: Object.values(GIT_ENV_KEYS.HTTPS), requiredKeys: REQUIRED_KEYS.HTTPS },
  { provider: 'gitlab', envKeys: Object.values(GIT_ENV_KEYS.GITLAB), requiredKeys: REQUIRED_KEYS.GITLAB },
];
