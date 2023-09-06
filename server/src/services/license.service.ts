import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InstanceSettingsService } from './instance_settings.service';
import { LICENSE_FIELD, LICENSE_TYPE, decrypt } from 'src/helpers/license.helper';
import License from '@ee/licensing/configs/License';
import { LicenseUpdateDto } from '@dto/license.dto';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { InstanceSettingsType } from 'src/helpers/instance_settings.constants';
import { CreateTrialLicenseDto } from '@dto/create-trial-license.dto';
import { EntityManager } from 'typeorm';
import got from 'got';
import { SelfhostCustomerLicense } from 'src/entities/selfhost_customer_license.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LicenseService {
  constructor(private instanceSettingsService: InstanceSettingsService, private configService: ConfigService) {}

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

  async getLicenseFieldValue(type: LICENSE_FIELD): Promise<any> {
    switch (type) {
      case LICENSE_FIELD.ALL:
        return License.Instance().terms;

      case LICENSE_FIELD.APP_COUNT:
        return License.Instance().apps;

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

      case LICENSE_FIELD.AUDIT_LOGS:
        return License.Instance().auditLog;

      case LICENSE_FIELD.VALID:
        return License.Instance().isValid && !License.Instance().isExpired;

      case LICENSE_FIELD.WORKSPACES:
        return License.Instance().workspaces;

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

      default:
        return License.Instance().terms;
    }
  }

  async init(): Promise<void> {
    const licenseSetting: InstanceSettings = await this.instanceSettingsService.getSettings(
      'LICENSE_KEY',
      InstanceSettingsType.SYSTEM
    );
    const updatedAt = await License.Instance()?.updatedAt;
    const isUpdated: boolean = updatedAt?.getTime() !== new Date(licenseSetting.updatedAt).getTime();

    if (!updatedAt || isUpdated) {
      // No License updated or new license available
      License.Reload(licenseSetting?.value, licenseSetting?.updatedAt);
    }
  }

  async getLicense(): Promise<InstanceSettings> {
    return await this.instanceSettingsService.getSettings('LICENSE_KEY', InstanceSettingsType.SYSTEM);
  }

  validateHostnameSubpath(domainsList = []) {
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
    const licenseSetting: InstanceSettings = await this.instanceSettingsService.getSettings(
      'LICENSE_KEY',
      InstanceSettingsType.SYSTEM
    );
    try {
      const licenseTerms = decrypt(dto.key);
      this.validateHostnameSubpath(licenseTerms.domains);
      await this.instanceSettingsService.update([{ id: licenseSetting.id, value: dto.key }]);
    } catch (err) {
      throw new BadRequestException(err?.response?.message || 'License key is invalid');
    }
  }

  async generateTrialLicense(createDto: CreateTrialLicenseDto) {
    const { email, hostname, subpath, companyName, otherData, customerId } = createDto;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const isExisted = await manager.findOne(SelfhostCustomerLicense, {
        where: { email },
      });
      if (isExisted) {
        if (isExisted.hostname === hostname && (!subpath || isExisted.subpath === subpath)) return isExisted.licenseKey;
        throw new ConflictException('License with same email exists');
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);
      const body = {
        expiry: expiryDate.toISOString().split('T')[0], // 14 days from now
        apps: '',
        workspaces: '',
        type: LICENSE_TYPE.TRIAL,
        users: {
          total: 15,
          editor: 5,
          viewer: 10,
          superadmin: 1,
        },
        database: {
          table: '',
        },
        domains: [
          {
            ...(subpath ? { subpath } : {}),
            hostname,
          },
        ],
        features: {
          oidc: true,
          auditLogs: true,
          ldap: true,
          customStyling: true,
        },
        meta: {
          generatedFrom: 'API',
          customerName: companyName || email,
          customerId,
        },
      };

      const LICENSE_SERVER_URL = this.configService.get<string>('LICENSE_SERVER_URL');
      const LICENSE_SERVER_SECRET = this.configService.get<string>('LICENSE_SERVER_SECRET');

      /* generate license here */
      const licenseResponse = await got(LICENSE_SERVER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${email}:${LICENSE_SERVER_SECRET}`).toString('base64')}`,
        },
        json: body,
      });

      if (!licenseResponse) {
        throw new Error('Empty response from Licensing');
      }
      const {
        license: licenseKey,
        meta: { customerName, customerId: customerIdGenerated },
      } = JSON.parse(licenseResponse.body);

      if (!licenseKey) {
        throw new Error('License key not generated');
      }

      /* add new entry to license table */
      const licenseEntry = manager.create(SelfhostCustomerLicense, {
        email,
        hostname,
        subpath,
        companyName: customerName,
        customerId: customerIdGenerated,
        otherData: JSON.stringify(otherData),
        licenseKey,
      });
      await manager.save(SelfhostCustomerLicense, licenseEntry);
      return licenseKey;
    });
  }
}
