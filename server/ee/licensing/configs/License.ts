import { decrypt } from 'src/helpers/license.helper';
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
  private isLicenseValid: boolean;

  private constructor(key: string, updatedDate: Date) {
    if (process.env.NODE_ENV !== 'test') {
      if (!(key && updatedDate)) {
        console.error('Invalid License Key', key);
        this.isLicenseValid = false;
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
        this.isAuditLogs = !!licenseData?.features?.auditLogs;
        this.isOidc = !!licenseData?.features?.oidc;
        this.expiryDate = new Date(`${licenseData.expiry} 23:59:59`);
        this.updatedDate = updatedDate;
        this.isLicenseValid = true;
      } catch (err) {
        console.error('Invalid License Key:Parse error', err);
        this.isLicenseValid = false;
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
    return this.appsCount || 'UNLIMITED';
  }

  public get users(): number | string {
    return this.usersCount || 'UNLIMITED';
  }

  public get editorUsers(): number | string {
    return this.editorUsersCount || 'UNLIMITED';
  }

  public get viewerUsers(): number | string {
    return this.viewerUsersCount || 'UNLIMITED';
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

  public get terms(): object {
    return {
      appsCount: this.apps,
      usersCount: this.users,
      auditLogEnabled: this.auditLog,
      oidcEnabled: this.oidc,
      expiryDate: this.expiryDate,
      isExpired: this.isExpired,
      editorUsers: this.editorUsers,
      viewerUsers: this.viewerUsers,
    };
  }

  public static Instance(): License {
    return this._instance;
  }

  public static Reload(key: string, updatedDate: Date): License {
    return (this._instance = new this(key, updatedDate));
  }
}
