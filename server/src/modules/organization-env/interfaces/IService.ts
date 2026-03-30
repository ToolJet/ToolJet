export type OrgEnvLoadedCallback = {
  onScanStart?: () => void;
  onFileLoaded: (organizationId: string, keys: ReadonlySet<string>) => Promise<void>;
  onScanComplete?: () => void;
};

export interface IOrganizationEnvRegistryService {
  initialize(): Promise<void>;
  reload(organizationId?: string): Promise<void>;
  has(organizationId: string, key: string): boolean;
  hasAll(organizationId: string, keys: readonly string[]): boolean;
  get(organizationId: string, key: string): Promise<string | undefined>;
  registerOrgEnvLoadedCallback(cb: OrgEnvLoadedCallback): void;
}
