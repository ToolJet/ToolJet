import { LICENSE_LIMIT, LICENSE_TYPE } from '../helper';
import { BASIC_PLAN_TERMS, BUSINESS_PLAN_TERMS, ENTERPRISE_PLAN_TERMS } from './PlanTerms';

export default class License {
  private static _instance: License;
  private _appsCount: number | string;
  private _tablesCount: number | string;
  private _usersCount: number | string;
  private _isAuditLogs: boolean;
  private _maxDurationForAuditLogs: number | string;
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

  private constructor() {
    this._isLicenseValid = false;
  }

  public get isExpired(): boolean {
    return true;
  }

  public get isValid(): boolean {
    return this._isLicenseValid;
  }

  public get apps(): number | string {
    if (this.IsBasicPlan) {
      return BASIC_PLAN_TERMS.apps || this._appsCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._appsCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get tables(): number | string {
    if (this.IsBasicPlan) {
      return BASIC_PLAN_TERMS.database?.table || this._tablesCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._tablesCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get maxDurationForAuditLogs(): number | string {
    if (this.IsBasicPlan) {
      return BASIC_PLAN_TERMS.auditLogs?.maximumDays || 0;
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
      return BASIC_PLAN_TERMS.users?.total || this._usersCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._usersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get editorUsers(): number | string {
    if (this.IsBasicPlan) {
      return BASIC_PLAN_TERMS.users?.editor || this._editorUsersCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._editorUsersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get viewerUsers(): number | string {
    if (this.IsBasicPlan) {
      return BASIC_PLAN_TERMS.users?.viewer || this._viewerUsersCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._viewerUsersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get superadminUsers(): number | string {
    if (this.IsBasicPlan) {
      return BASIC_PLAN_TERMS.users?.superadmin || this._superadminUsersCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._superadminUsersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get workspaces(): number | string {
    if (this.IsBasicPlan) {
      return BASIC_PLAN_TERMS.workspaces || this._workspacesCount || LICENSE_LIMIT.UNLIMITED;
    }
    return this._workspacesCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get domains(): Array<{ hostname?: string; subpath?: string }> {
    if (this.IsBasicPlan) {
      return BASIC_PLAN_TERMS.domains || this._domainsList || [];
    }
    return this._domainsList || [];
  }

  public get auditLogs(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.auditLogs;
    }
    return this._isAuditLogs;
  }

  public get oidc(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.oidc;
    }
    return this._isOidc;
  }

  public get ldap(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.ldap;
    }
    return this._isLdap;
  }

  public get gitSync(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.gitSync;
    }
    return this._isGitSync;
  }

  public get saml(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.saml;
    }
    return this._isSAML;
  }

  public get multiEnvironment(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.multiEnvironment;
    }
    return this._isMultiEnvironment;
  }

  public get customStyling(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.customStyling;
    }
    return this._isCustomStyling;
  }

  public get whiteLabelling(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.whiteLabelling;
    }
    return this._isWhiteLabelling;
  }

  public get customThemes(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.customThemes;
    }
    return this._isCustomThemes;
  }

  public get multiPlayerEdit(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.multiPlayerEdit;
    }
    return this._isMultiPlayerEdit;
  }

  public get comments(): boolean {
    if (this.IsBasicPlan) {
      return !!BASIC_PLAN_TERMS.features?.comments;
    }
    return this._isComments;
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
    };
  }

  private get IsBasicPlan(): boolean {
    return !this.isValid || this.isExpired;
  }

  public static Instance(): License {
    return this._instance ? this._instance : new this();
  }

  public get workflows(): object {
    if (this.IsBasicPlan) {
      return BASIC_PLAN_TERMS.workflows;
    }
    return this._workflows ?? BASIC_PLAN_TERMS.workflows;
  }
}
