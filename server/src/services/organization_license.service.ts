import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_TYPE, decrypt } from 'src/helpers/license.helper';
import { LicenseUpdateDto } from '@dto/license.dto';
import { OrganizationsLicense } from 'src/entities/organization_license.entity';
import { OrganizationPayment } from 'src/entities/organizations_payments.entity';
import { CreateCloudTrialLicenseDto } from '@dto/create-cloud-trial-license.dto';
import { EntityManager } from 'typeorm';
import got from 'got';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { ConfigService } from '@nestjs/config';
import { BASIC_PLAN_TERMS } from '@ee/licensing/configs/PlanTerms';
import { LICENSE_LIMIT } from 'src/helpers/license.helper';
import { AuditLoggerService } from './audit_logger.service';
import { ActionTypes, ResourceTypes } from 'src/entities/audit_log.entity';

@Injectable()
export class OrganizationLicenseService {
  constructor(private configService: ConfigService, private auditLoggerService: AuditLoggerService) {}

  async getLicenseTerms(organizationId: string, type?: LICENSE_FIELD | LICENSE_FIELD[]): Promise<any> {
    if (Array.isArray(type)) {
      const result: any = {};

      type.forEach(async (key) => {
        result[key] = await this.getLicenseFieldValue(key, organizationId);
      });

      return result;
    } else {
      return await this.getLicenseFieldValue(type, organizationId);
    }
  }

  private async getLicenseFieldValue(type: LICENSE_FIELD, organizationId: string): Promise<any> {
    const licenseSettings: OrganizationsLicense = await this.getLicense(organizationId);
    const expiryDate = licenseSettings && new Date(`${licenseSettings?.terms?.expiry} 23:59:59`);
    const isExpired = expiryDate && new Date().getTime() > expiryDate.getTime();
    const isValid = licenseSettings?.organizationId === organizationId;
    const isBasicPlan = !licenseSettings || isExpired || !isValid;

    const getFeatureValue = (featureName: string) => {
      if (isBasicPlan) {
        return !!BASIC_PLAN_TERMS.features?.[featureName] || licenseSettings.terms.features[featureName];
      }
      return licenseSettings.terms.features[featureName];
    };

    const getLimitValue = (keyPath: string[]) => {
      if (isBasicPlan) {
        return (
          keyPath.reduce((obj, key) => obj && obj[key], BASIC_PLAN_TERMS) ||
          keyPath.reduce((obj, key) => obj && obj[key], licenseSettings.terms) ||
          LICENSE_LIMIT.UNLIMITED
        );
      }
      return keyPath.reduce((obj, key) => obj && obj[key], licenseSettings.terms) || LICENSE_LIMIT.UNLIMITED;
    };

    switch (type) {
      case LICENSE_FIELD.ALL:
        return {
          ...licenseSettings.terms,
          apps: getLimitValue(['apps']),
          database: {
            table: getLimitValue(['database', 'table']),
          },
          users: {
            total: getLimitValue(['users', 'total']),
            editor: getLimitValue(['users', 'editor']),
            viewer: getLimitValue(['users', 'viewer']),
            superadmin: getLimitValue(['users', 'superadmin']),
          },
          features: {
            oidc: getFeatureValue('oidc'),
            ldap: getFeatureValue('ldap'),
            saml: getFeatureValue('saml'),
            customStyling: getFeatureValue('customStyling'),
            auditLogs: getFeatureValue('auditLogs'),
            multiEnvironment: getFeatureValue('multiEnvironment'),
            whiteLabelling: getFeatureValue('whiteLabelling'),
            multiPlayerEdit: getFeatureValue('multiPlayerEdit'),
          },
        };

      case LICENSE_FIELD.APP_COUNT:
        return getLimitValue(['apps']);

      case LICENSE_FIELD.TABLE_COUNT:
        return getLimitValue(['database', 'table']);

      case LICENSE_FIELD.TOTAL_USERS:
      case LICENSE_FIELD.EDITORS:
      case LICENSE_FIELD.VIEWERS:
      case LICENSE_FIELD.SUPERADMINS:
        return getLimitValue(['users', type.toLowerCase()]);

      case LICENSE_FIELD.IS_EXPIRED:
        return isExpired;

      case LICENSE_FIELD.OIDC:
      case LICENSE_FIELD.LDAP:
      case LICENSE_FIELD.SAML:
      case LICENSE_FIELD.CUSTOM_STYLE:
      case LICENSE_FIELD.AUDIT_LOGS:
      case LICENSE_FIELD.MULTI_ENVIRONMENT:
      case LICENSE_FIELD.WHITE_LABEL:
      case LICENSE_FIELD.MULTI_PLAYER_EDIT:
        return getFeatureValue(type.toLowerCase());

      case LICENSE_FIELD.USER:
        return {
          total: getLimitValue(['users', 'total']),
          editors: getLimitValue(['users', 'editor']),
          viewers: getLimitValue(['users', 'viewer']),
          superadmins: getLimitValue(['users', 'superadmin']),
        };

      case LICENSE_FIELD.FEATURES:
        return {
          oidc: getFeatureValue('oidc'),
          ldap: getFeatureValue('ldap'),
          saml: getFeatureValue('saml'),
          customStyling: getFeatureValue('customStyling'),
          auditLogs: getFeatureValue('auditLogs'),
          multiEnvironment: getFeatureValue('multiEnvironment'),
          whiteLabelling: getFeatureValue('whiteLabelling'),
          multiPlayerEdit: getFeatureValue('multiPlayerEdit'),
        };

      case LICENSE_FIELD.STATUS:
        return {
          isLicenseValid: true,
          isExpired,
          licenseType: isBasicPlan ? LICENSE_TYPE.BASIC : licenseSettings.terms.type,
          expiryDate: licenseSettings.terms.expiry,
        };

      case LICENSE_FIELD.META:
        return licenseSettings.terms.meta;

      case LICENSE_FIELD.VALID:
        return isValid;

      default:
        return {
          ...licenseSettings.terms,
          apps: getLimitValue(['apps']),
          database: {
            table: getLimitValue(['database', 'table']),
          },
          users: {
            total: getLimitValue(['users', 'total']),
            editor: getLimitValue(['users', 'editor']),
            viewer: getLimitValue(['users', 'viewer']),
            superadmin: getLimitValue(['users', 'superadmin']),
          },
          features: {
            oidc: getFeatureValue('oidc'),
            ldap: getFeatureValue('ldap'),
            saml: getFeatureValue('saml'),
            customStyling: getFeatureValue('customStyling'),
            auditLogs: getFeatureValue('auditLogs'),
            multiEnvironment: getFeatureValue('multiEnvironment'),
            whiteLabelling: getFeatureValue('whiteLabelling'),
            multiPlayerEdit: getFeatureValue('multiPlayerEdit'),
          },
          type: isBasicPlan ? LICENSE_TYPE.BASIC : licenseSettings.terms.type,
        };
    }
  }

  async getLicense(organizationId: string): Promise<OrganizationsLicense> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(OrganizationsLicense, { where: { organizationId: organizationId } });
    });
  }

  async updateLicense(dto: LicenseUpdateDto, organizationId: string): Promise<void> {
    try {
      const licenseTerms = decrypt(dto.key);
      if (!licenseTerms?.expiry) {
        throw new Error('Invalid License Key:expiry not found');
      }

      const isLicenseValidForOrganization = organizationId === licenseTerms?.workspaceId;
      if (!isLicenseValidForOrganization) {
        throw new Error('Incorrect organization in license key');
      }
      await dbTransactionWrap((manager: EntityManager) => {
        return manager.update(
          OrganizationsLicense,
          { organizationId: licenseTerms?.workspaceId || organizationId },
          { licenseKey: dto.key, terms: licenseTerms, expiryDate: licenseTerms.expiry, licenseType: licenseTerms.type }
        );
      });
    } catch (err) {
      throw new BadRequestException(err?.message || 'License key is invalid');
    }
  }

  async generateCloudTrialLicense(createDto: CreateCloudTrialLicenseDto, manager?: EntityManager) {
    const { email, companyName, organizationId, customerId } = createDto;
    try {
      return await dbTransactionWrap(async (manager: EntityManager) => {
        const organizationLicense = await manager
          .createQueryBuilder(OrganizationsLicense, 'org_license')
          .innerJoin('org_license.organization', 'organization', 'org_license.organization_id = :organizationId', {
            organizationId,
          })
          .getOne();

        if (organizationLicense) {
          throw new ConflictException('Trial license already exists for this organization');
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 14);
        const body = {
          expiry: expiryDate.toISOString().split('T')[0],
          type: LICENSE_TYPE.TRIAL,
          workspaceId: organizationId,
          users: {
            total: 15,
            editor: 5,
            viewer: 10,
            superadmin: 1,
          },
          database: {
            table: '',
          },
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
        const LICENSE_SERVER_URL = this.configService.get<string>('LICENSE_SERVER_URL_V2');
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
        const { license: licenseKey } = JSON.parse(licenseResponse.body);

        if (!licenseKey) {
          throw new Error('License key not generated');
        }

        await this.auditLoggerService.perform(
          {
            userId: customerId,
            organizationId: organizationId,
            resourceId: customerId,
            resourceType: ResourceTypes.USER,
            resourceName: email,
            actionType: ActionTypes.TRIAL_GENERATION_FOR_WORKSPACE,
          },
          manager
        );
        return licenseKey;
      }, manager);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getOrganizationLicensePayment(organizationId: string): Promise<OrganizationPayment> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(OrganizationPayment, { where: { organizationId: organizationId } });
    });
  }

  async createOrgnaizationLicensePAyment(organizationPaymentCreateObj, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(OrganizationPayment, manager.create(OrganizationPayment, organizationPaymentCreateObj));
    }, manager);
  }

  async updateOrganizationLicensePayment(organizationId: string, updateObject = {}): Promise<OrganizationPayment> {
    return await dbTransactionWrap((manager: EntityManager) => {
      return manager.update(OrganizationPayment, { organizationId: organizationId }, { ...updateObject });
    });
  }
}
