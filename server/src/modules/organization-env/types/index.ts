export type ResolveOutcome = 'resolved' | 'absent' | 'unknown';

export interface GitHttpsEnvConfig {
  httpsUrl: string;
  githubBranch: string;
  githubAppId: string;
  githubInstallationId: string;
  githubPrivateKey: string;
  githubEnterpriseUrl?: string;
  githubEnterpriseApiUrl?: string;
}

export interface GitLabEnvConfig {
  gitlabUrl: string;
  gitlabBranch: string;
  gitlabProjectId: string;
  gitlabProjectAccessToken?: string;
  gitlabEnterpriseUrl?: string;
}

export type EnvProviderState = { isEnabled: boolean; isFinalized: boolean };

export interface OidcEnvConfig {
  clientId: string;
  wellKnownUrl: string;
  clientSecret?: string;
  name?: string;
  customScopes?: string;
  claimName?: string;
  enableGroupSync?: boolean;
  groupMapping?: Record<string, string>;
  grantType?: string;
  codeVerifier?: string;
}

export interface SamlEnvConfig {
  idpMetadata: string;
  name: string;
  groupAttribute?: string;
  groupSyncEnabled?: boolean;
}

export interface LdapEnvConfig {
  host: string;
  port: string;
  basedn: string;
  name: string;
  ssl?: boolean;
  // Only present when LDAP_SSL_CERTIFICATE=Certificates — omitted entirely (not just empty)
  // when LDAP_SSL_CERTIFICATE=None or absent, even if the individual cert keys are set in .env.
  sslCerts?: { client_key: string; client_cert: string; server_cert: string };
  enableGroupSync?: boolean;
}
