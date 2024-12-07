import { Injectable } from '@nestjs/common';
import { LICENSE_FIELD } from './helper';
import License from '@licensing/configs/License';

@Injectable()
export class LicenseService {
  constructor() {}
  async getLicenseTerms(type?: LICENSE_FIELD | LICENSE_FIELD[]): Promise<any> {
    if (Array.isArray(type)) {
      const result: any = {};

      type.forEach(async (key) => {
        result[key] = await this.getLicenseFieldValue(key);
      });

      return result;
    } else {
      return await this.getLicenseFieldValue(type);
    }
  }

  private async getLicenseFieldValue(type: LICENSE_FIELD): Promise<any> {
    switch (type) {
      case LICENSE_FIELD.ALL:
        return License.Instance().terms;

      case LICENSE_FIELD.APP_COUNT:
        return License.Instance().apps;

      case LICENSE_FIELD.TABLE_COUNT:
        return License.Instance().tables;

      case LICENSE_FIELD.TOTAL_USERS:
        return License.Instance().users;

      case LICENSE_FIELD.EDITORS:
        return License.Instance().editorUsers;

      case LICENSE_FIELD.VIEWERS:
        return License.Instance().viewerUsers;

      case LICENSE_FIELD.IS_EXPIRED:
        return License.Instance().isExpired;

      case LICENSE_FIELD.OIDC:
        return License.Instance().oidc;

      case LICENSE_FIELD.LDAP:
        return License.Instance().ldap;

      case LICENSE_FIELD.SAML:
        return License.Instance().saml;

      case LICENSE_FIELD.GIT_SYNC:
        return License.Instance().gitSync;

      case LICENSE_FIELD.CUSTOM_STYLE:
        return License.Instance().customStyling;

      case LICENSE_FIELD.AUDIT_LOGS:
        return License.Instance().auditLogs;

      case LICENSE_FIELD.MAX_DURATION_FOR_AUDIT_LOGS:
        return License.Instance().maxDurationForAuditLogs;

      case LICENSE_FIELD.MULTI_ENVIRONMENT:
        return License.Instance().multiEnvironment;

      case LICENSE_FIELD.VALID:
        return License.Instance().isValid && !License.Instance().isExpired;

      case LICENSE_FIELD.WORKSPACES:
        return License.Instance().workspaces;

      case LICENSE_FIELD.WHITE_LABEL:
        return License.Instance().whiteLabelling;

      case LICENSE_FIELD.USER:
        return {
          total: License.Instance().users,
          editors: License.Instance().editorUsers,
          viewers: License.Instance().viewerUsers,
          superadmins: License.Instance().superadminUsers,
        };

      case LICENSE_FIELD.FEATURES:
        return License.Instance().features;

      case LICENSE_FIELD.DOMAINS:
        return License.Instance().domains;

      case LICENSE_FIELD.STATUS:
        return {
          isLicenseValid: License.Instance().isValid,
          isExpired: License.Instance().isExpired,
          licenseType: License.Instance().licenseType,
          expiryDate: License.Instance().expiry,
        };

      case LICENSE_FIELD.META:
        return License.Instance().metaData;

      case LICENSE_FIELD.WORKFLOWS:
        return License.Instance().workflows;

      default:
        return License.Instance().terms;
    }
  }

  async init(): Promise<void> {
    return;
  }

  async validateLicenseUsersCount(licenseUsers): Promise<boolean> {
    return true;
  }
}
