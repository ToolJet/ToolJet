import { Terms } from '../types';
import { readFileSync } from 'fs';
import { publicDecrypt } from 'crypto';
import { resolve } from 'path';

export default class License {
  private static _instance: License;
  private appsCount: number;
  private usersCount: number;
  private isAuditLogs: boolean;
  private isOidc: boolean;
  private expiryDate: Date;
  private editorUsersCount: number;
  private viewerUsersCount: number;

  private constructor() {
    if (process.env.NODE_ENV !== 'test') {
      if (!process.env.LICENSE_KEY) {
        throw new Error('LICENSE_KEY not found');
      }

      try {
        const licenseData: Partial<Terms> = this.decrypt(process.env.LICENSE_KEY);

        if (!licenseData?.expiry) {
          throw new Error('LICENSE_KEY:expiry not found');
        }

        this.appsCount = licenseData?.apps;
        this.usersCount = licenseData?.users?.total;
        this.editorUsersCount = licenseData?.users?.editor;
        this.viewerUsersCount = licenseData?.users?.viewer;
        this.isAuditLogs = !!licenseData?.features?.auditLogs;
        this.isOidc = !!licenseData?.features?.oidc;
        this.expiryDate = new Date(`${licenseData.expiry} 23:59:59`);
      } catch (err) {
        console.error(err);
        throw new Error('LICENSE_KEY invalid');
      }
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      // Setting expiry 30 minutes
      this.expiryDate = now;
      this.isAuditLogs = true;
      this.isOidc = true;
    }
  }

  public isExpired(): boolean {
    return new Date() > this.expiryDate;
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

  public get terms(): object {
    return {
      appsCount: this.apps,
      usersCount: this.users,
      auditLogEnabled: this.auditLog,
      oidcEnabled: this.oidc,
      expiryDate: this.expiryDate,
      isExpired: this.isExpired(),
      editorUsers: this.editorUsers,
      viewerUsers: this.viewerUsers,
    };
  }

  public static get Instance(): License {
    return this._instance || (this._instance = new this());
  }

  private decrypt(toDecrypt: string): Terms {
    const absolutePath = resolve('keys/public.pem');
    const publicKey = readFileSync(absolutePath, 'utf8');
    const buffer = Buffer.from(toDecrypt, 'base64');
    const decrypted = publicDecrypt(publicKey, buffer);
    return JSON.parse(decrypted.toString('utf8'));
  }
}
