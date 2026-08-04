export abstract class GitTagInterface {
  abstract deleteGitTag(appId: string, versionName: string, organizationId: string): Promise<void>;
}
