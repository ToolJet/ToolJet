import { LICENSE_LIMIT, LICENSE_TYPE } from '@modules/licensing/constants';
import { Terms } from '@modules/licensing/interfaces/terms';
import {
  BUSINESS_PLAN_TERMS,
  ENTERPRISE_PLAN_TERMS,
  WORKFLOW_TEAM_PLAN_TERMS,
} from '@modules/licensing/constants/PlanTerms';

export default class LicenseBase {
  private _appsCount: number | string;
  private _tablesCount: number | string;
  private _usersCount: number | string;
  private _isAuditLogs: boolean;
  private _maxDurationForAuditLogs: number | string;
  private _isFlexiblePlan: boolean;
  private _isOidc: boolean;
  private _isLdap: boolean;
  private _isSAML: boolean;
  private _isCustomStyling: boolean;
  private _isWhiteLabelling: boolean;
  private _isCustomThemes: boolean;
  private _isMultiEnvironment: boolean;
  private _isMultiPlayerEdit: boolean;
  private _isComments: boolean;
  private _expiryDate: Date;
  private _updatedDate: Date;
  private _editorUsersCount: number | string;
  private _viewerUsersCount: number | string;
  private _superadminUsersCount: number | string;
  private _isLicenseValid: boolean;
  private _workspacesCount: number | string;
  private _domainsList: Array<{ hostname?: string; subpath?: string }>;
  private _type: string;
  private _isGitSync: boolean;
  private _metaData: object;
  private _workflows: object;
  private _features: object;
  private _startDate: Date;
  private _workspaceId: string;
  private _isAi: boolean;
  private _ai: object;
  private _isExternalApis: boolean;
  private _isAppWhiteLabelling: boolean;
  private BASIC_PLAN_TERMS: Partial<Terms>;

  constructor(
    licenseData?: Partial<Terms>,
    updatedDate?: Date,
    startDate?: Date,
    expiryDate?: Date,
    BASIC_PLAN_TERMS?: Partial<Terms>
  ) {
    this.BASIC_PLAN_TERMS = BASIC_PLAN_TERMS;

    if (process.env.NODE_ENV === 'test') {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      // Setting expiry 30 minutes
      this._expiryDate = now;
      this._isAuditLogs = true;
      this._isOidc = true;
      this._isLdap = true;
      this._isGitSync = true;
      this._isCustomStyling = true;
      this._isWhiteLabelling = true;
      this._isCustomThemes = true;
      this._isLicenseValid = true;
      this._isMultiEnvironment = true;
      this._isAi = true;
      this._isExternalApis = true;
      this._isAppWhiteLabelling = true;
      return;
    }
    if (!licenseData) {
      this._isLicenseValid = false;
      this._type = LICENSE_TYPE.BASIC;
      return;
    }
    this._expiryDate = expiryDate || new Date(`${licenseData.expiry} 23:59:59`);
    this._startDate = startDate;
    this._isFlexiblePlan = licenseData?.plan?.isFlexible === true;
    this._appsCount = licenseData?.apps;
    this._usersCount = licenseData?.users?.total;
    this._tablesCount = licenseData?.database?.table;
    this._editorUsersCount = licenseData?.users?.editor;
    this._viewerUsersCount = licenseData?.users?.viewer;
    this._superadminUsersCount = licenseData?.users?.superadmin;
    this._updatedDate = updatedDate;
    this._isLicenseValid = true;
    this._workspacesCount = licenseData?.workspaces;
    this._type = licenseData?.type;
    this._domainsList = licenseData?.domains;
    this._metaData = licenseData?.meta;
    this._workflows = licenseData?.workflows;
    this._workspaceId = licenseData?.workspaceId;
    this._features = licenseData?.features;
    this._ai = licenseData?.ai;

    // Features
    this._isAuditLogs = this.getFeatureValue('auditLogs');
    this._maxDurationForAuditLogs = this._isAuditLogs !== false ? licenseData?.auditLogs?.maximumDays : 0;
    this._isOidc = this.getFeatureValue('oidc');
    this._isLdap = this.getFeatureValue('ldap');
    this._isSAML = this.getFeatureValue('saml');
    this._isCustomStyling = this.getFeatureValue('customStyling');
    this._isWhiteLabelling = this.getFeatureValue('whiteLabelling');
    this._isAppWhiteLabelling = this.getFeatureValue('appWhiteLabelling');
    this._isCustomThemes = this.getFeatureValue('customThemes');
    this._isMultiEnvironment = this.getFeatureValue('multiEnvironment');
    this._isMultiPlayerEdit = this.getFeatureValue('multiPlayerEdit');
    this._isComments = this.getFeatureValue('comments');
    this._isGitSync = this.getFeatureValue('gitSync');
    this._isAi = this.getFeatureValue('ai');
    this._isExternalApis = this.getFeatureValue('externalApis');
  }

  private getFeatureValue(key: string) {
    if (!this._features || this._features[key] === false) {
      return false;
    }
    if (this._isFlexiblePlan && !this._features[key]) {
      return false;
    }
    return true;
  }

  public get isExpired(): boolean {
    return this._expiryDate && new Date().getTime() > this._expiryDate.getTime();
  }

  public get isValid(): boolean {
    return this._isLicenseValid;
  }

  public get apps(): number | string {
    if (this.IsBasicPlan) {
      return this.BASIC_PLAN_TERMS.apps || this._appsCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._appsCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get tables(): number | string {
    if (this.IsBasicPlan) {
      return this.BASIC_PLAN_TERMS.database?.table || this._tablesCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._tablesCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get maxDurationForAuditLogs(): number | string {
    if (this.IsBasicPlan) {
      return this.BASIC_PLAN_TERMS.auditLogs?.maximumDays || 0;
    }
    const maxDuration =
      typeof this._maxDurationForAuditLogs === 'string'
        ? parseInt(this._maxDurationForAuditLogs, 10)
        : this._maxDurationForAuditLogs;

    if (this.licenseType != LICENSE_TYPE.BUSINESS) {
      return maxDuration <= ENTERPRISE_PLAN_TERMS.auditLogs.maximumDays
        ? maxDuration
        : ENTERPRISE_PLAN_TERMS.auditLogs.maximumDays;
    } else {
      return maxDuration <= BUSINESS_PLAN_TERMS.auditLogs.maximumDays
        ? maxDuration
        : BUSINESS_PLAN_TERMS.auditLogs.maximumDays;
    }
  }

  public get users(): number | string {
    if (this.IsBasicPlan) {
      return this.BASIC_PLAN_TERMS.users?.total || this._usersCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._usersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get editorUsers(): number | string {
    if (this.IsBasicPlan) {
      return this.BASIC_PLAN_TERMS.users?.editor || this._editorUsersCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._editorUsersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get viewerUsers(): number | string {
    if (this.IsBasicPlan) {
      return this.BASIC_PLAN_TERMS.users?.viewer || this._viewerUsersCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._viewerUsersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get superadminUsers(): number | string {
    if (this.IsBasicPlan) {
      return this.BASIC_PLAN_TERMS.users?.superadmin || this._superadminUsersCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._superadminUsersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get workspaces(): number | string {
    if (this.IsBasicPlan) {
      return this.BASIC_PLAN_TERMS.workspaces || this._workspacesCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._workspacesCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get workspaceId(): string {
    return this._workspaceId;
  }

  public get domains(): Array<{ hostname?: string; subpath?: string }> {
    if (this.IsBasicPlan) {
      return this.BASIC_PLAN_TERMS.domains || this._domainsList || [];
    }
    return this._domainsList || [];
  }

  public get auditLogs(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.auditLogs;
    }
    return this._isAuditLogs;
  }

  public get oidc(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.oidc;
    }
    return this._isOidc;
  }

  public get ldap(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.ldap;
    }
    return this._isLdap;
  }

  public get gitSync(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.gitSync;
    }
    return this._isGitSync;
  }

  public get saml(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.saml;
    }
    return this._isSAML;
  }

  public get multiEnvironment(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.multiEnvironment;
    }
    return this._isMultiEnvironment;
  }

  public get customStyling(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.customStyling;
    }
    return this._isCustomStyling;
  }

  public get whiteLabelling(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.whiteLabelling;
    }
    return this._isWhiteLabelling;
  }

  public get appWhiteLabelling(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.appWhiteLabelling;
    }
    return this._isAppWhiteLabelling;
  }

  public get customThemes(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.customThemes;
    }
    return this._isCustomThemes;
  }

  public get externalApis(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.externalApi;
    }
    return this._isExternalApis;
  }

  public get multiPlayerEdit(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.multiPlayerEdit;
    }
    return this._isMultiPlayerEdit;
  }

  public get comments(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.comments;
    }
    return this._isComments;
  }

  public get ai(): object {
    return this._ai || {};
  }

  public get aiFeature(): boolean {
    if (this.IsBasicPlan) {
      return !!this.BASIC_PLAN_TERMS.features?.ai;
    }
    return this._isAi;
  }

  public get updatedAt(): Date {
    return this._updatedDate;
  }

  public get licenseType(): string {
    return this._type || LICENSE_TYPE.ENTERPRISE;
  }

  public get features(): object {
    return {
      openid: this.oidc,
      auditLogs: this.auditLogs,
      ldap: this.ldap,
      saml: this.saml,
      customStyling: this.customStyling,
      whiteLabelling: this.whiteLabelling,
      customThemes: this.customThemes,
      multiEnvironment: this.multiEnvironment,
      multiPlayerEdit: this.multiPlayerEdit,
      gitSync: this.gitSync,
      comments: this.comments,
      ai: this.aiFeature,
      appWhiteLabelling: this.appWhiteLabelling,
    };
  }

  public get expiry(): Date {
    return this._expiryDate;
  }

  public get metaData(): object {
    return this._metaData;
  }

  public get terms(): object {
    return {
      appsCount: this.apps,
      tablesCount: this.tables,
      usersCount: this.users,
      auditLogsEnabled: this.auditLogs,
      maxDurationForAuditLogs: this.maxDurationForAuditLogs,
      oidcEnabled: this.oidc,
      ldapEnabled: this.ldap,
      samlEnabled: this.saml,
      customStylingEnabled: this.customStyling,
      customThemesEnabled: this.customThemes,
      multiEnvironmentEnabled: this.multiEnvironment,
      multiPlayerEditEnabled: this.multiPlayerEdit,
      commentsEnabled: this.comments,
      expiryDate: this._expiryDate,
      isExpired: this.isExpired,
      isLicenseValid: this._isLicenseValid,
      editorUsers: this.editorUsers,
      viewerUsers: this.viewerUsers,
      workspacesCount: this.workspaces,
      workflows: this.workflows,
      startDate: this.startDate,
    };
  }

  public get startDate(): Date {
    return this._startDate;
  }

  private get IsBasicPlan(): boolean {
    return !this.isValid || this.isExpired;
  }

  public get workflows(): object {
    if (this.IsBasicPlan || this.licenseType === LICENSE_TYPE.TRIAL) {
      return this.BASIC_PLAN_TERMS.workflows;
    }
    return this._workflows ?? WORKFLOW_TEAM_PLAN_TERMS.workflows;
  }
}
