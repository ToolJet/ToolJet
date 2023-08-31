import { decrypt, LICENSE_LIMIT, LICENSE_TYPE } from 'src/helpers/license.helper';
import { Terms } from '../types';

export default class License {
  private static _instance: License;
  private appsCount: number;
  private usersCount: number;
  private isAuditLogs: boolean;
  private isOidc: boolean;
  private expiryDate: Date;
  private updatedDate: Date;
  private editorUsersCount: number;
  private viewerUsersCount: number;
  private superadminUsersCount: number;
  private isLicenseValid: boolean;
  private workspacesCount: number;
  private featuresAccess: object;
  private domainsList: Array<{ hostname?: string; subpath?: string }>;
  private type: string;

  private constructor(key: string, updatedDate: Date) {
    if (process.env.NODE_ENV !== 'test') {
      if (!(key && updatedDate)) {
        console.error('Invalid License Key', key);
        this.isLicenseValid = false;
        this.type = LICENSE_TYPE.BASIC;
        return;
      }

      try {
        const licenseData: Partial<Terms> = decrypt(key);

        if (!licenseData?.expiry) {
          throw new Error('Invalid License Key:expiry not found');
        }

        this.appsCount = licenseData?.apps;
        this.usersCount = licenseData?.users?.total;
        this.editorUsersCount = licenseData?.users?.editor;
        this.viewerUsersCount = licenseData?.users?.viewer;
        this.superadminUsersCount = licenseData?.users?.superadmin;
        this.isAuditLogs = !!licenseData?.features?.auditLogs;
        this.isOidc = !!licenseData?.features?.oidc;
        this.expiryDate = new Date(`${licenseData.expiry} 23:59:59`);
        this.updatedDate = updatedDate;
        this.isLicenseValid = true;
        this.workspacesCount = licenseData?.workspaces;
        this.type = licenseData?.type;
        this.featuresAccess = licenseData?.features;
        this.domainsList = licenseData?.domains;
      } catch (err) {
        console.error('Invalid License Key:Parse error', err);
        this.isLicenseValid = false;
        this.type = LICENSE_TYPE.BASIC;
      }
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      // Setting expiry 30 minutes
      this.expiryDate = now;
      this.isAuditLogs = true;
      this.isOidc = true;
      this.isLicenseValid = true;
    }
  }

  public get isExpired(): boolean {
    return this.expiryDate && new Date().getTime() > this.expiryDate.getTime();
  }

  public get isValid(): boolean {
    return this.isLicenseValid;
  }

  public get apps(): number | string {
    return this.appsCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get users(): number | string {
    return this.usersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get editorUsers(): number | string {
    return this.editorUsersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get viewerUsers(): number | string {
    return this.viewerUsersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get superadminUsers(): number | string {
    return this.superadminUsersCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get auditLog(): boolean {
    return !!this.isAuditLogs;
  }

  public get oidc(): boolean {
    return !!this.isOidc;
  }

  public get updatedAt(): Date {
    return this.updatedDate;
  }

  public get licenseType(): string {
    return this.type || LICENSE_TYPE.ENTERPRISE;
  }

  public get workspaces(): number | string {
    return this.workspacesCount || LICENSE_LIMIT.UNLIMITED;
  }

  public get features(): object {
    const access = this.featuresAccess || {
      openid: false,
      auditLogs: false,
    };

    access['openid'] = access['oidc'] || access['openid'];
    delete access['oidc'];

    return access;
  }

  public get domains(): Array<{ hostname?: string; subpath?: string }> {
    return this.domainsList || [];
  }

  public get expiry(): Date {
    return this.expiryDate;
  }

  public get terms(): object {
    return {
      appsCount: this.apps,
      usersCount: this.users,
      auditLogEnabled: this.auditLog,
      oidcEnabled: this.oidc,
      expiryDate: this.expiryDate,
      isExpired: this.isExpired,
      isLicenseValid: this.isLicenseValid,
      editorUsers: this.editorUsers,
      viewerUsers: this.viewerUsers,
      workspacesCount: this.workspacesCount,
    };
  }

  public static Instance(): License {
    return this._instance;
  }

  public static Reload(key: string, updatedDate: Date): License {
    return (this._instance = new this(key, updatedDate));
  }
}
