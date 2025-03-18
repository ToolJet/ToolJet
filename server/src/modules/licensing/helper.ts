import LicenseBase from './configs/LicenseBase';
import { LICENSE_FIELD, LICENSE_LIMIT } from './constants';

export function generatePayloadForLimits(currentCount: number, totalCount: any, licenseStatus: object, label?: string) {
  return totalCount !== LICENSE_LIMIT.UNLIMITED
    ? {
        percentage: (currentCount / totalCount) * 100,
        total: totalCount,
        current: currentCount,
        licenseStatus,
        label,
        canAddUnlimited: false,
      }
    : {
        canAddUnlimited: true,
        licenseStatus,
        label,
      };
}

export function getLicenseFieldValue(type: LICENSE_FIELD, licenseInstance: LicenseBase): any {
  switch (type) {
    case LICENSE_FIELD.ALL:
      return licenseInstance.terms;

    case LICENSE_FIELD.APP_COUNT:
      return licenseInstance.apps;

    case LICENSE_FIELD.TABLE_COUNT:
      return licenseInstance.tables;

    case LICENSE_FIELD.TOTAL_USERS:
      return licenseInstance.users;

    case LICENSE_FIELD.EDITORS:
      return licenseInstance.editorUsers;

    case LICENSE_FIELD.VIEWERS:
      return licenseInstance.viewerUsers;

    case LICENSE_FIELD.IS_EXPIRED:
      return licenseInstance.isExpired;

    case LICENSE_FIELD.OIDC:
      return licenseInstance.oidc;

    case LICENSE_FIELD.LDAP:
      return licenseInstance.ldap;

    case LICENSE_FIELD.SAML:
      return licenseInstance.saml;

    case LICENSE_FIELD.GIT_SYNC:
      return licenseInstance.gitSync;

    case LICENSE_FIELD.CUSTOM_STYLE:
      return licenseInstance.customStyling;

    case LICENSE_FIELD.CUSTOM_THEMES:
      return licenseInstance.customThemes;

    case LICENSE_FIELD.AUDIT_LOGS:
      return licenseInstance.auditLogs;

    case LICENSE_FIELD.MAX_DURATION_FOR_AUDIT_LOGS:
      return licenseInstance.maxDurationForAuditLogs;

    case LICENSE_FIELD.MULTI_ENVIRONMENT:
      return licenseInstance.multiEnvironment;

    case LICENSE_FIELD.VALID:
      return licenseInstance.isValid && !licenseInstance.isExpired;

    case LICENSE_FIELD.WORKSPACES:
      return licenseInstance.workspaces;

    case LICENSE_FIELD.WHITE_LABEL:
      return licenseInstance.whiteLabelling;

    case LICENSE_FIELD.USER:
      return {
        total: licenseInstance.users,
        editors: licenseInstance.editorUsers,
        viewers: licenseInstance.viewerUsers,
        superadmins: licenseInstance.superadminUsers,
      };

    case LICENSE_FIELD.FEATURES:
      return licenseInstance.features;

    case LICENSE_FIELD.DOMAINS:
      return licenseInstance.domains;

    case LICENSE_FIELD.STATUS:
      return {
        isLicenseValid: licenseInstance.isValid,
        isExpired: licenseInstance.isExpired,
        licenseType: licenseInstance.licenseType,
        expiryDate: licenseInstance.expiry,
      };

    case LICENSE_FIELD.META:
      return licenseInstance.metaData;

    case LICENSE_FIELD.WORKFLOWS:
      return licenseInstance.workflows;

    case LICENSE_FIELD.AI_FEATURE:
      return licenseInstance.aiFeature;

    case LICENSE_FIELD.AI:
      return licenseInstance.ai;

    default:
      return licenseInstance.terms;
  }
}
