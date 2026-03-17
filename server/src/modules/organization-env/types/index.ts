export interface GitHttpsEnvConfig {
  httpsUrl: string;
  githubBranch: string;
  githubAppId: string;
  githubInstallationId: string;
  githubPrivateKey: string;
  githubEnterpriseUrl?: string;
  githubEnterpriseApiUrl?: string;
}

export interface GitSshEnvConfig {
  gitUrl: string;
  gitBranch: string;
  sshPrivateKey: string;
  sshPublicKey: string;
  keyType: string;
}

export interface GitLabEnvConfig {
  gitlabUrl: string;
  gitlabBranch: string;
  gitlabProjectId: string;
  gitlabProjectAccessToken?: string;
  gitlabEnterpriseUrl?: string;
}
