import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_TYPE, decrypt, freshDeskBaseUrl } from 'src/helpers/license.helper';
import License from '@ee/licensing/configs/License';
import { LicenseUpdateDto } from '@dto/license.dto';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { CreateTrialLicenseDto } from '@dto/create-trial-license.dto';
import { EntityManager } from 'typeorm';
import got from 'got';
import { SelfhostCustomerLicense } from 'src/entities/selfhost_customer_license.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { ConfigService } from '@nestjs/config';
import { CRMData } from '@ee/licensing/types';

@Injectable()
export class LicenseService {
  constructor(private configService: ConfigService) {}

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

  async generateTrialLicense(createDto: CreateTrialLicenseDto) {
    const { firstName, lastName, email, hostname, subpath, companyName, otherData, customerId, version } = createDto;

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

      const LICENSE_SERVER_URL =
        version !== '2'
          ? this.configService.get<string>('LICENSE_SERVER_URL')
          : this.configService.get<string>('LICENSE_SERVER_URL_V2');
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

      this.createCRMUser({ firstName, lastName, email, isTrialOpted: true });

      return licenseKey;
    });
  }

  async createCRMUser(user: CRMData): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return true;

    try {
      await got(`${freshDeskBaseUrl}contacts`, {
        method: 'post',
        headers: { Authorization: `Token token=${process.env.FWAPIKey}`, 'Content-Type': 'application/json' },
        json: {
          contact: {
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            custom_field: {
              job_title: user.role,
              ...(user.isTrialOpted && { cf_has_started_on_prem_trial: 1 }),
            },
          },
        },
      });
    } catch (error) {
      const errors = JSON.parse(error.response?.body || '{}').errors;
      const freshDeskContactAlreadyExists = (email, errorMessage) => errorMessage?.includes(`${email} already exists`);

      if (errors?.code === 400 && freshDeskContactAlreadyExists(user.email, errors?.message?.[0])) {
        console.log(`Contact ${user.email} already exists. Updating custom fields.`);
        this.updateCRM(user);
      } else {
        console.error('error while connection to freshDeskBaseUrl : createCRMUser', error);
      }
    }

    return true;
  }

  async updateCRM(user: CRMData): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return true;

    try {
      const response = await got(`${freshDeskBaseUrl}lookup?q=${user.email}&f=email&entities=contact`, {
        method: 'get',
        headers: {
          Authorization: `Token token=${process.env.FWAPIKey}`,
          'Content-Type': 'application/json',
        },
      });

      const contacts = JSON.parse(response.body)['contacts']['contacts'];

      if (!contacts?.length) {
        return;
      }

      await got(`${freshDeskBaseUrl}contacts/${contacts[0].id}`, {
        method: 'put',
        headers: { Authorization: `Token token=${process.env.FWAPIKey}`, 'Content-Type': 'application/json' },
        json: {
          contact: {
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            custom_field: {
              job_title: user.role,
              ...(user.isTrialOpted && { cf_has_started_on_prem_trial: 1 }),
            },
          },
        },
      });
    } catch (error) {
      console.error('error while connection to freshDeskBaseUrl : updateCRM', error);
    }

    return true;
  }

  isBasicPlan = async () => !(await this.getLicenseFieldValue(LICENSE_FIELD.VALID));
}
