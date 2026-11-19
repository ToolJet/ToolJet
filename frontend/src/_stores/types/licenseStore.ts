import type { StateCreator } from 'zustand';

export interface ILicenseStatus {
  isLicenseValid: boolean;
  isExpired: boolean;
  licenseType: string;
  expiryDate: string;
}

// Response of GET /license/access, sampled from an EE test system. The CE response may omit fields.
// It is `{}` until loaded, hence every field is optional.
export interface IFeatureAccess {
  licenseStatus?: ILicenseStatus;
  plan?: string;
  aiPlan?: string;
  appPagesLimit?: number | string;
  openid?: boolean;
  auditLogs?: boolean;
  ldap?: boolean;
  saml?: boolean;
  customStyling?: boolean;
  whiteLabelling?: boolean;
  customThemes?: boolean;
  serverSideGlobalResolve?: boolean;
  multiEnvironment?: boolean;
  multiPlayerEdit?: boolean;
  gitSync?: boolean;
  gitSyncMultiBranch?: boolean;
  comments?: boolean;
  ai?: boolean;
  appWhiteLabelling?: boolean;
  modulesEnabled?: boolean;
  customGroups?: boolean;
  appPagesAddNavGroupEnabled?: boolean;
  appPagesHeaderAndLogoEnabled?: boolean;
  canvasPageHeaderEnabled?: boolean;
  canvasPageFooterEnabled?: boolean;
  appPagesEnabled?: boolean;
  appPermissionComponent?: boolean;
  appPermissionQuery?: boolean;
  appPermissionPages?: boolean;
  workflowsEnabled?: boolean;
  customDomain?: boolean;
  promote?: boolean;
  release?: boolean;
  google?: boolean;
  github?: boolean;
  externalApis?: boolean;
  scim?: boolean;
  mfa?: boolean;
  observabilityEnabled?: boolean;
  appHistory?: boolean;
  appJsLibraries?: boolean;
  queryFolders?: boolean;
  workspaceEnv?: boolean;
  customComponentLibraries?: boolean;
  publicApp?: boolean;
}

export interface ILicenseActions {
  fetchFeatureAccess: () => void;
  checkModuleAccess: () => void;
}

export interface ILicenseStore {
  featureAccess: IFeatureAccess;
  featuresLoaded: boolean;
  hasModuleAccess: boolean;
  moduleAccessLoading: boolean;
  actions: ILicenseActions;
}

export type ILicenseStoreInitialState = Omit<ILicenseStore, 'actions'>;

// Mirrors the `zustandDevTools` wrapper the store is created with.
export type LicenseStoreCreator = StateCreator<ILicenseStore, [['zustand/devtools', never]]>;
