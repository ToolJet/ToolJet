import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { LICENSE_FIELD, LICENSE_TYPE, decrypt } from 'src/helpers/license.helper';
import { LicenseUpdateDto } from '@dto/license.dto';
import { OrganizationsLicense } from 'src/entities/organization_license.entity';
import { OrganizationPayment } from 'src/entities/organizations_payments.entity';
import { CreateCloudTrialLicenseDto } from '@dto/create-cloud-trial-license.dto';
import { Brackets, EntityManager } from 'typeorm';
import got from 'got';
import { dbTransactionWrap, cleanObject } from 'src/helpers/utils.helper';
import { ConfigService } from '@nestjs/config';
import { BASIC_PLAN_TERMS } from '@ee/licensing/configs/PlanTerms';
import { LICENSE_LIMIT } from 'src/helpers/license.helper';
import { AuditLoggerService } from './audit_logger.service';
import { ResourceTypes, ActionTypes } from 'src/entities/audit_log.entity';
import { Terms } from '@ee/licensing/types';
import { USER_STATUS, USER_TYPE } from 'src/helpers/user_lifecycle';
import { User } from 'src/entities/user.entity';

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

  private get STRIPE_PRICE_CODE_ITEM_MAPPING(): Readonly<any> {
    return {
      month: {
        [this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY_EDITOR')]: 'editor',
        [this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY_VIEWER')]: 'reader',
      },
      year: {
        [this.configService.get<string>('STRIPE_PRICE_ID_YEARLY_EDITOR')]: 'editor',
        [this.configService.get<string>('STRIPE_PRICE_ID_YEARLY_VIEWER')]: 'reader',
      },
    };
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

  async UpdateOrInsertCloudLicense(organizationLicensePayment: OrganizationPayment, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const expiryDate = new Date(`${new Date().toISOString().split('T')[0]} 23:59:59`);

      //Initializing expiry date for license
      if (organizationLicensePayment.subscriptionType == 'monthly') expiryDate.setDate(expiryDate.getDate() + 32);
      else {
        expiryDate.setDate(expiryDate.getDate() + 367);
      }

      const currLicense = await this.getLicense(organizationLicensePayment.organizationId);
      const totalUsers =
        parseInt(organizationLicensePayment?.noOfEditors?.toString() || '0') +
        parseInt(organizationLicensePayment?.noOfReaders?.toString() || '0');
      //License update will take place if already a license present
      if (currLicense) {
        if (currLicense.licenseType !== LICENSE_TYPE.TRIAL) {
          const currentExpiry = currLicense.expiryDate;
          const dayDiff = Math.round((currentExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff > 0) {
            // License not expired starts new license from current expiry
            if (organizationLicensePayment.subscriptionType == 'monthly') {
              expiryDate.setDate(currentExpiry.getDate() + (dayDiff > 1 ? 31 : 32));
            } else {
              expiryDate.setDate(currentExpiry.getDate() + (dayDiff > 1 ? 366 : 367));
            }
          }
        }
        const terms = { ...currLicense.terms };
        terms.type = terms.type === LICENSE_TYPE.TRIAL ? LICENSE_TYPE.BUSINESS : terms.type;
        terms.users.editor = organizationLicensePayment.noOfEditors;
        terms.users.viewer = organizationLicensePayment.noOfReaders;
        (terms.users.total = totalUsers), (terms.expiry = expiryDate.toISOString().split('T')[0]);
        await manager.update(
          OrganizationsLicense,
          { organizationId: organizationLicensePayment.organizationId },
          {
            expiryDate,
            terms,
            licenseType:
              currLicense.licenseType === LICENSE_TYPE.TRIAL ? LICENSE_TYPE.BUSINESS : currLicense.licenseType,
          }
        );
      } else {
        //Generating new licesne since old is not present
        const licenseTerm: Terms = {
          expiry: expiryDate.toISOString().split('T')[0],
          type: LICENSE_TYPE.BUSINESS,
          workspaceId: organizationLicensePayment.organizationId,
          users: {
            total: totalUsers,
            editor: organizationLicensePayment.noOfEditors,
            viewer: organizationLicensePayment.noOfReaders,
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
            customerName: organizationLicensePayment.companyName || organizationLicensePayment.email,
            customerId: organizationLicensePayment.userId,
          },
        };

        const organizationLicenseObject = manager.create(OrganizationsLicense, {
          organizationId: organizationLicensePayment.organizationId,
          licenseType: LICENSE_TYPE.BUSINESS,
          expiryDate: expiryDate,
          terms: licenseTerm,
        });

        await manager.save(OrganizationsLicense, organizationLicenseObject);
      }

      //Updating payment status after licesne generation
      organizationLicensePayment.paymentStatus = 'success';
      organizationLicensePayment.isLicenseGenerated = true;
      manager.update(OrganizationPayment, { id: organizationLicensePayment.id }, organizationLicensePayment);

      // if (paymentType == 'subscription') {
      //   await this.auditLoggerService.perform(
      //     {
      //       userId: organizationLicensePayment.userId,
      //       organizationId: organizationLicensePayment.organizationId,
      //       resourceId: organizationLicensePayment.userId,
      //       resourceType: ResourceTypes.USER,
      //       resourceName: organizationLicensePayment.email,
      //       actionType: ActionTypes.CLOUD_LICENSE_GENERATION_FOR_WORKSPACE,
      //     },
      //     manager
      //   );
      // }
      return;
    }, manager);
  }

  async getOrganizationLicensePayments(
    organizationId?: string,
    subscriptionId?: string,
    invoiceId?: string
  ): Promise<OrganizationPayment[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      const searchParam = {
        organizationId: organizationId,
        subscriptionId: subscriptionId,
        invoiceId: invoiceId,
      };
      cleanObject(searchParam);
      if (!searchParam) {
        throw new BadRequestException('Please enter search parameter for license payment object');
      }
      return manager.find(OrganizationPayment, { where: searchParam });
    });
  }

  async createOrganizationLicensePayment(
    organizationPaymentCreateObj,
    manager?: EntityManager
  ): Promise<OrganizationPayment> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(OrganizationPayment, manager.create(OrganizationPayment, organizationPaymentCreateObj));
    }, manager);
  }

  async updateOrganizationLicensePayment(id: string, updateObject = {}): Promise<OrganizationPayment> {
    return await dbTransactionWrap((manager: EntityManager) => {
      return manager.update(OrganizationPayment, { id: id }, { ...updateObject });
    });
  }

  async licenseUpgradeValidation(organizationId: string, checkParam, manager?: EntityManager) {
    const editorsViewersCount = await this.fetchTotalViewerEditorCount(manager, organizationId);
    if (checkParam?.NumberOfEditor && checkParam?.NumberOfEditor < editorsViewersCount.editor) return false;
    if (checkParam?.NumberOfViewers && checkParam?.NumberOfViewers < editorsViewersCount.viewer) return false;
    return true;
  }

  async webhookCheckoutSessionCompleteHandler(paymentObject) {
    /**
     * This function handle checkout successful event from stripe webhook and only used for generating license
     * incase of new subscription.It will not handle recurring payment for the existing subscription.
     * @param   paymentObject  : Data object present in checkout successful event of stripe event
     * @returns void.
     */

    const metaData = paymentObject.metadata;
    const invoiceId = paymentObject.invoice;
    const subscriptionId = paymentObject.subscription;
    const { organizationId, email, companyName, userId } = metaData;
    const invoicePaidDate = new Date(paymentObject.created * 1000);
    const subscriptionType = metaData.subscriptionType;
    const mode = paymentObject.mode;
    const noOfEditors = metaData.editors || 1;
    const noOfReaders = metaData.viewers || 1;
    const paymentStatus = paymentObject.payment_status == 'paid' ? 'success' : 'failed';
    const invoiceType = 'subscription';

    //Getting list of all invoice for all subscription of given organization
    const existOrgSubscription = await this.getOrganizationLicensePayments(organizationId, subscriptionId);

    //Checking if subscription already exist in table as checkout successful event will only handle new subscriptions
    if (existOrgSubscription && existOrgSubscription.length > 0) {
      //If subscription exist then either this is recurring payment or pending payment. These case will be handle in invoice payment succesfull event
      throw new ConflictException(`Subscription ${subscriptionId} already exist`);
    }

    await dbTransactionWrap(async (manager: EntityManager) => {
      //Creating Organization Payment since its new subscription
      const organizationPayment = await this.createOrganizationLicensePayment(
        {
          organizationId,
          userId,
          subscriptionId,
          invoiceId,
          invoicePaidDate,
          subscriptionType,
          mode,
          noOfEditors,
          invoiceType,
          noOfReaders,
          companyName,
          email,
          paymentStatus,
        },
        manager
      );

      //Will generate license only if the amount is paid for the event
      if (paymentStatus == 'success') {
        //do we need to cancel other subscription??Right now its manual based. To be checked in revamp

        //Generating license
        await this.UpdateOrInsertCloudLicense(organizationPayment, manager);
      }
    });
  }
  async webhookInvoicePaidHandler(invoiceObject) {
    /**
     * This function handle invoice paid successful event from stripe webhook and only used for recurring payment
     * for license update or to handle license generation of event with payment pending status
     * @param   invoiceObject  : Data object present in invoice paid successful event of stripe event
     * @returns void.
     */

    if (!invoiceObject.paid) {
      throw new BadRequestException('Payment not success');
    }

    const invoiceId = invoiceObject.id;
    const subscriptionId = invoiceObject?.subscription;
    const invoicePaidDate = new Date(invoiceObject.created * 1000);
    const invoiceType = 'recurring';

    let productList: any = {};
    let interval;
    const STRIPE_PRICE_CODE_ITEM_MAPPING = this.STRIPE_PRICE_CODE_ITEM_MAPPING;

    function createItemsList(lineItem) {
      const productType = STRIPE_PRICE_CODE_ITEM_MAPPING[lineItem?.plan?.interval]?.[lineItem?.price?.id];
      if (productType) interval = lineItem?.plan?.interval;
      if (productType == 'reader') productList = { noOfReaders: parseInt(lineItem.quantity), ...productList };
      else if (productType == 'editor') {
        productList = { noOfEditors: parseInt(lineItem.quantity), ...productList };
      }
    }
    const lineItems = invoiceObject.lines.data;
    lineItems.map(createItemsList);

    if (!productList?.noOfReaders || !productList?.noOfEditors || !interval) {
      throw new BadRequestException(`Product list ${productList} or interval missing`);
    }
    interval += 'ly';

    //Getting all invoice paid for given subscriptions id
    const organizationLicensePayment = await this.getOrganizationLicensePayments(undefined, subscriptionId);

    if (!organizationLicensePayment || organizationLicensePayment.length === 0) {
      throw new BadRequestException(`Subscription id : ${subscriptionId} not found`);
    }

    //Check if given invoice is present for the subscriptionId and then checking payment status for the same
    const organizationPaymentForInvoice = organizationLicensePayment.find((item) => item.invoiceId === invoiceId);
    const paymentStatus = 'success';
    //If payment status was pending while checkout successful this will handle that checkout and generate the license

    await dbTransactionWrap(async (manager: EntityManager) => {
      if (
        organizationPaymentForInvoice &&
        (organizationPaymentForInvoice.paymentStatus != 'success' || !organizationPaymentForInvoice.isLicenseGenerated)
      ) {
        //Handling pending payment
        organizationPaymentForInvoice.subscriptionType = interval;
        await this.UpdateOrInsertCloudLicense(organizationPaymentForInvoice, manager);
      } else if (
        organizationPaymentForInvoice?.paymentStatus == 'success' &&
        organizationPaymentForInvoice.isLicenseGenerated
      ) {
        throw new ConflictException(
          'Already activated for the invoice id : ' + organizationPaymentForInvoice.invoiceId
        );
      } else {
        //Handling recurring payment as its new invoice for given subscription
        const anyOrgPayment = organizationLicensePayment[0];

        const organizationLicenseRecurringPayment = await this.createOrganizationLicensePayment(
          {
            organizationId: anyOrgPayment.organizationId,
            userId: anyOrgPayment.userId,
            subscriptionId,
            invoiceId,
            invoicePaidDate,
            invoiceType,
            paymentStatus,
            subscriptionType: interval,
            mode: anyOrgPayment.mode,
            noOfEditors: productList.noOfEditors || 1,
            noOfReaders: productList.noOfReaders || 1,
            companyName: anyOrgPayment.companyName,
            email: anyOrgPayment.email,
          },
          manager
        );
        await this.UpdateOrInsertCloudLicense(organizationLicenseRecurringPayment, manager);
      }
    });
  }

  private createAppsJoinCondition(organizationId?: string): string {
    return organizationId ? 'apps.organizationId = :organizationId' : '1=1';
  }

  private createGroupPermissionsJoinCondition(organizationId?: string): string {
    return organizationId ? 'group_permissions.organizationId = :organizationId' : '1=1';
  }

  createOrganizationUsersJoinCondition(organizationId?: string): string {
    const statusCondition = 'organization_users.status IN (:...statusList)';
    const organizationCondition = organizationId ? ' AND organization_users.organizationId = :organizationId' : '';
    return `${statusCondition}${organizationCondition}`;
  }

  private async getUserIdWithEditPermission(manager: EntityManager, organizationId?: string) {
    const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];
    const groupPermissionsCondition = this.createGroupPermissionsJoinCondition(organizationId);
    const organizationUsersCondition = this.createOrganizationUsersJoinCondition(organizationId);
    const appsCondition = this.createAppsJoinCondition(organizationId);
    const userIdsWithEditPermissions = (
      await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.groupPermissions', 'group_permissions', groupPermissionsCondition, { organizationId })
        .leftJoin('group_permissions.appGroupPermission', 'app_group_permissions')
        .innerJoin('users.organizationUsers', 'organization_users', organizationUsersCondition, {
          statusList,
          organizationId,
        })
        .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
        .andWhere(
          new Brackets((qb) => {
            qb.where('app_group_permissions.read = true AND app_group_permissions.update = true').orWhere(
              'group_permissions.appCreate = true'
            );
          })
        )
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    const userIdsOfAppOwners = (
      await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.apps', 'apps', appsCondition, { organizationId })
        .innerJoin('users.organizationUsers', 'organization_users', organizationUsersCondition, {
          statusList,
          organizationId,
        })
        .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    const userIdsOfSuperAdmins = (
      await manager
        .createQueryBuilder(User, 'users')
        .select('users.id')
        .where('users.userType = :userType', { userType: USER_TYPE.INSTANCE })
        .andWhere('users.status = :status', { status: USER_STATUS.ACTIVE })
        .getMany()
    ).map((record) => record.id);

    return [...new Set([...userIdsWithEditPermissions, ...userIdsOfAppOwners, ...userIdsOfSuperAdmins])];
  }

  async fetchTotalEditorCount(manager: EntityManager, organizationId?: string): Promise<number> {
    const userIdsWithEditPermissions = await this.getUserIdWithEditPermission(manager, organizationId);
    return userIdsWithEditPermissions?.length || 0;
  }

  async fetchTotalViewerEditorCount(
    manager: EntityManager,
    organizationId?: string
  ): Promise<{ editor: number; viewer: number }> {
    const userIdsWithEditPermissions = await this.getUserIdWithEditPermission(manager, organizationId);
    const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];
    const organizationUsersCondition = this.createOrganizationUsersJoinCondition(organizationId);

    if (!userIdsWithEditPermissions?.length) {
      // No editors -> No viewers
      return { editor: 0, viewer: 0 };
    }
    const viewer = await manager
      .createQueryBuilder(User, 'users')
      .innerJoin('users.organizationUsers', 'organization_users', organizationUsersCondition, {
        statusList,
        organizationId,
      })
      .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
      .andWhere('users.id NOT IN(:...userIdsWithEditPermissions)', { userIdsWithEditPermissions })
      .select('users.id')
      .distinct()
      .getCount();

    return { editor: userIdsWithEditPermissions?.length || 0, viewer };
  }
}
