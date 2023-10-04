import { BadRequestException, Injectable } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_TYPE, decrypt } from 'src/helpers/license.helper';
import License from '@ee/licensing/configs/License';
import { LicenseUpdateDto } from '@dto/license.dto';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager } from 'typeorm';

@Injectable()
export class LicenseService {
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

      case LICENSE_FIELD.CUSTOM_STYLE:
        return License.Instance().customStyling;

      case LICENSE_FIELD.AUDIT_LOGS:
        return License.Instance().auditLogs;

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

      this.validateHostnameSubpath(licenseTerms.domains);
      await dbTransactionWrap((manager: EntityManager) => {
        return manager.update(InstanceSettings, { id: licenseSetting.id }, { value: dto.key });
      });
    } catch (err) {
      throw new BadRequestException(err?.message || 'License key is invalid');
    }
  }

  isBasicPlan = async () => !(await this.getLicenseFieldValue(LICENSE_FIELD.VALID));
}
