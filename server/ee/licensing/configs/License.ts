import { decrypt, LICENSE_LIMIT, LICENSE_TYPE } from 'src/helpers/license.helper';
import { Terms } from '../types';
import { BASIC_PLAN_TERMS } from './PlanTerms';

export default class License {
  private static _instance: License;
  private _appsCount: number | string;
  private _tablesCount: number | string;
  private _usersCount: number | string;
  private _isAuditLogs: boolean;
  private _isOidc: boolean;
  private _isLdap: boolean;
  private _isCustomStyling: boolean;
  private _isMultiEnvironment: boolean;
  private _expiryDate: Date;
  private _updatedDate: Date;
  private _editorUsersCount: number | string;
  private _viewerUsersCount: number | string;
  private _superadminUsersCount: number | string;
  private _isLicenseValid: boolean;
  private _workspacesCount: number | string;
  private _domainsList: Array<{ hostname?: string; subpath?: string }>;
  private _type: string;
  private _metaData: object;

  private constructor(key: string, updatedDate: Date) {
    if (process.env.NODE_ENV !== 'test') {
      if (!(key && updatedDate)) {
        console.error('Invalid License Key', key);
        this._isLicenseValid = false;
        this._type = LICENSE_TYPE.BASIC;
        return;
      }

      try {
        const licenseData: Partial<Terms> = decrypt(key);

        if (!licenseData?.expiry) {
          throw new Error('Invalid License Key:expiry not found');
        }

        this._appsCount = licenseData?.apps;
        this._usersCount = licenseData?.users?.total;
        this._tablesCount = licenseData?.database?.table;
        this._editorUsersCount = licenseData?.users?.editor;
        this._viewerUsersCount = licenseData?.users?.viewer;
        this._superadminUsersCount = licenseData?.users?.superadmin;
        this._isAuditLogs = licenseData?.features?.auditLogs === false ? false : true;
        this._isOidc = licenseData?.features?.oidc === false ? false : true;
        this._isLdap = licenseData?.features?.ldap === false ? false : true;
        this._isCustomStyling = licenseData?.features?.customStyling === false ? false : true;
        this._isMultiEnvironment = licenseData?.features?.multiEnvironment === false ? false : true;
        this._expiryDate = new Date(`${licenseData.expiry} 23:59:59`);
        this._updatedDate = updatedDate;
        this._isLicenseValid = true;
        this._workspacesCount = licenseData?.workspaces;
        this._type = licenseData?.type;
        this._domainsList = licenseData?.domains;
        this._metaData = licenseData?.meta;
      } catch (err) {
        console.error('Invalid License Key:Parse error', err);
        this._isLicenseValid = false;
        this._type = LICENSE_TYPE.BASIC;
      }
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      // Setting expiry 30 minutes
      this._expiryDate = now;
      this._isAuditLogs = true;
      this._isOidc = true;
      this._isLdap = true;
      this._isCustomStyling = true;
      this._isLicenseValid = true;
      this._isMultiEnvironment = true;
    }
  }

  public get isExpired(): boolean {
    return this._expiryDate && new Date().getTime() > this._expiryDate.getTime();
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
      customStyling: this.customStyling,
      multiEnvironment: this.multiEnvironment,
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
      oidcEnabled: this.oidc,
      ldapEnabled: this.ldap,
      customStylingEnabled: this.customStyling,
      multiEnvironmentEnabled: this.multiEnvironment,
      expiryDate: this._expiryDate,
      isExpired: this.isExpired,
      isLicenseValid: this._isLicenseValid,
      editorUsers: this.editorUsers,
      viewerUsers: this.viewerUsers,
      workspacesCount: this.workspaces,
    };
  }

  private get IsBasicPlan(): boolean {
    return !this.isValid || this.isExpired;
  }

  public static Instance(): License {
    return this._instance;
  }

  public static Reload(key: string, updatedDate: Date): License {
    return (this._instance = new this(key, updatedDate));
  }
}
