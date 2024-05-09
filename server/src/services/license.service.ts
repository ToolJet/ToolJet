import { BadRequestException, Injectable, HttpException } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_TYPE, decrypt } from 'src/helpers/license.helper';
import License from '@ee/licensing/configs/License';
import { LicenseUpdateDto } from '@dto/license.dto';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { LicenseCountsService } from '@services/license_counts.service';
import { EntityManager } from 'typeorm';
import { LICENSE_LIMIT } from 'src/helpers/license.helper';
import { dbTransactionWrap } from 'src/helpers/utils.helper';

@Injectable()
export class LicenseService {
  constructor(private readonly licenseCountsService: LicenseCountsService) {}
  async getLicenseTerms(type?: LICENSE_FIELD | LICENSE_FIELD[]): Promise<any> {
    await this.init();

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

  getLicense(): Promise<InstanceSettings> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOneOrFail(InstanceSettings, { where: { key: 'LICENSE_KEY' } });
    });
  }

  async init(): Promise<void> {
    const licenseSetting: InstanceSettings = await this.getLicense();
    const updatedAt = License.Instance()?.updatedAt;
    const isUpdated: boolean = updatedAt?.getTime() !== new Date(licenseSetting.updatedAt).getTime();

    if (!updatedAt || isUpdated) {
      // No License updated or new license available
      License.Reload(licenseSetting?.value, licenseSetting?.updatedAt);
    }
  }

  validateHostnameSubpath(domainsList = []) {
    if (!domainsList.length && (!License.Instance()?.isValid || License.Instance()?.isExpired)) {
      // not validating license for invalid licenses -> Basic plan
      return;
    }
    //check for valid hostname
    const domain = process.env.TOOLJET_HOST;
    const subPath = process.env.SUB_PATH;
    const domains = domainsList.length ? domainsList : License.Instance().domains || [];

    if (domains?.length) {
      if (subPath) {
        if (!domains.some((host) => host.subpath === subPath && host.hostname === domain)) {
          throw new BadRequestException(`Domain configurations does not match with ${domain}${subPath || ''}`);
        }
      } else {
        if (!domains.some((host) => host.hostname === domain && !host.subPath)) {
          throw new BadRequestException(`Domain configurations does not match with ${domain}${subPath || ''}`);
        }
      }
    }
  }

  async validateLicenseUsersCount(licenseUsers): Promise<boolean> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      let editor = -1,
        viewer = -1;
      const { editor: editorUsers, viewer: viewerUsers, superadmin: superadminUsers, total: users } = licenseUsers;

      if (superadminUsers !== LICENSE_LIMIT.UNLIMITED) {
        const superadmin = await this.licenseCountsService.fetchTotalSuperadminCount(manager);
        if (superadmin > superadminUsers) {
          return false;
        }
      }

      if (users !== LICENSE_LIMIT.UNLIMITED && (await this.licenseCountsService.getUsersCount(true, manager)) > users) {
        return false;
      }

      if (editorUsers === LICENSE_LIMIT.UNLIMITED && viewerUsers === LICENSE_LIMIT.UNLIMITED) {
        return true;
      } else {
        const counts = await this.licenseCountsService.fetchTotalViewerEditorCount(manager);
        editor = counts.editor;
        viewer = counts.viewer;

        if (editorUsers !== LICENSE_LIMIT.UNLIMITED) {
          if (editor > editorUsers) {
            return false;
          }
        }

        if (viewerUsers !== LICENSE_LIMIT.UNLIMITED) {
          if (viewer > viewerUsers) {
            return false;
          }
        }
        return true;
      }
    });
  }

  async updateLicense(dto: LicenseUpdateDto): Promise<void> {
    const licenseSetting: InstanceSettings = await this.getLicense();
    try {
      const licenseTerms = decrypt(dto.key);

      // TODO: validate expiry of new license

      const { isLicenseValid } = await this.getLicenseTerms(LICENSE_FIELD.STATUS);

      // updated with a valid license and trying to update trial license generated using API
      if (isLicenseValid && licenseTerms?.type === LICENSE_TYPE.TRIAL && licenseTerms?.meta?.generatedFrom === 'API') {
        throw new Error(
          'Trying to use a trial license key, please reach out to hello@tooljet.com to get a valid license key'
        );
      }

      if (!(await this.validateLicenseUsersCount(licenseTerms?.users))) {
        throw new HttpException(
          'Your builder or end-user count exceeds the limit for your upgraded plan. Please archive users or increase your plan limits to upgrade successfully.',
          402
        );
      }

      this.validateHostnameSubpath(licenseTerms.domains);
      await dbTransactionWrap((manager: EntityManager) => {
        return manager.update(InstanceSettings, { id: licenseSetting.id }, { value: dto.key });
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new BadRequestException(err?.message || 'License key is invalid');
      }
    }
  }

  isBasicPlan = async () => !(await this.getLicenseFieldValue(LICENSE_FIELD.VALID));
}
