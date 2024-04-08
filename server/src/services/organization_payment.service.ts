import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import Stripe from 'stripe';
import { camelizeKeys } from 'humps';
import { EmailService } from './email.service';
import { cleanObject, dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager, getManager } from 'typeorm';
import { OrganizationSubscriptionInvoice } from 'src/entities/organization_subscription_invoice.entity';
import { OrganizationSubscription } from 'src/entities/organization_subscription.entity';
import { UpdateSubscriptionDto } from '@dto/update-subscription.dto';
import { OrganizationLicenseService } from './organization_license.service';
import { LICENSE_FIELD, LICENSE_TYPE } from 'src/helpers/license.helper';
import { OrganizationsLicense } from 'src/entities/organization_license.entity';
import { Terms } from '@ee/licensing/types';
import { User } from 'src/entities/user.entity';
import { PaymentRedirectDto } from '@dto/subscription-redirect.dto';
import { LicenseService } from './license.service';

@Injectable()
export class OrganizationPaymentService {
  constructor(
    private configService: ConfigService,
    private organizationLicenseService: OrganizationLicenseService,
    private emailService: EmailService,
    private licenseService: LicenseService
  ) {}

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

  async getUpcomingInvoice(organizationId: string): Promise<OrganizationSubscriptionInvoice> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(OrganizationSubscriptionInvoice, {
        where: { organizationId: organizationId },
        order: { createdAt: 'DESC' },
      });
    });
  }

  async getCurrentPlan(organizationId: string) {
    const stripeAPIKey = this.configService.get<string>('STRIPE_API_KEY');
    const stripe = new Stripe(stripeAPIKey);
    return dbTransactionWrap(async (manager: EntityManager) => {
      const organizationPayment = await manager.findOne(OrganizationSubscription, {
        where: { organizationId: organizationId },
        order: { createdAt: 'DESC' },
      });
      const invoice = await this.getUpcomingInvoice(organizationId);
      if (organizationPayment) {
        const subscription = await stripe.subscriptions.retrieve(organizationPayment.subscriptionId);
        return { ...camelizeKeys(subscription), ...organizationPayment, invoice };
      }
    });
  }

  async updateInvoice(updateCondition = {}, updateObject = {}): Promise<OrganizationSubscriptionInvoice> {
    return await dbTransactionWrap((manager: EntityManager) => {
      return manager.update(OrganizationSubscriptionInvoice, { ...updateCondition }, { ...updateObject });
    });
  }

  async getProration(organizationId: string, prorationDto) {
    const { items, prorationDate, includeChange } = prorationDto;
    const stripeAPIKey = this.configService.get<string>('STRIPE_API_KEY');
    const stripe = new Stripe(stripeAPIKey);

    return dbTransactionWrap(async (manager: EntityManager) => {
      const organizationSubscription = await manager.findOne(OrganizationSubscription, {
        where: { organizationId: organizationId },
        order: { createdAt: 'DESC' },
      });
      const invoice = await stripe.invoices.retrieveUpcoming({
        customer: organizationSubscription.customerId,
        subscription: organizationSubscription.subscriptionId,
        subscription_items: items,
        ...(!includeChange && { subscription_proration_date: prorationDate }),
        subscription_proration_behavior: includeChange ? 'none' : 'always_invoice',
      });

      return invoice;
    });
  }

  async getPortalLink(portalDto) {
    const stripeAPIKey = this.configService.get<string>('STRIPE_API_KEY');
    const stripe = new Stripe(stripeAPIKey);
    const { customerId, returnUrl } = portalDto;

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateSubscription(organizationId: string, updatedSubscription: UpdateSubscriptionDto) {
    const { items, prorationDate, includeChange } = updatedSubscription;
    const stripeAPIKey = this.configService.get<string>('STRIPE_API_KEY');
    const stripe = new Stripe(stripeAPIKey);

    return dbTransactionWrap(async (manager: EntityManager) => {
      const organizationSubscription = await manager.findOne(OrganizationSubscription, {
        where: { organizationId: organizationId },
        order: { createdAt: 'DESC' },
      });
      const subscription = await stripe.subscriptions.update(organizationSubscription.subscriptionId, {
        proration_behavior: includeChange ? 'none' : 'always_invoice',
        items,
        ...(!includeChange && { proration_date: prorationDate }),
      });
      return { ...subscription, ...organizationSubscription };
    });
  }

  async licenseUpgradeValidation(organizationId: string, checkParam, manager?: EntityManager) {
    const editorsViewersCount = await this.organizationLicenseService.fetchTotalViewerEditorCount(
      manager,
      organizationId
    );
    if (checkParam?.NumberOfEditor && checkParam?.NumberOfEditor < editorsViewersCount.editor) return false;
    if (checkParam?.NumberOfViewers && checkParam?.NumberOfViewers < editorsViewersCount.viewer) return false;
    return true;
  }

  async UpdateOrInsertCloudLicense(organizationSubscription: OrganizationSubscription, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const expiryDate = new Date(`${new Date().toISOString().split('T')[0]} 23:59:59Z`);
      //Initializing expiry date for license
      if (organizationSubscription.subscriptionType == 'monthly') expiryDate.setDate(expiryDate.getDate() + 32);
      else {
        expiryDate.setDate(expiryDate.getDate() + 367);
      }

      const currLicense = await this.organizationLicenseService.getLicense(organizationSubscription.organizationId);
      const totalUsers =
        parseInt(organizationSubscription?.noOfEditors?.toString() || '0') +
        parseInt(organizationSubscription?.noOfReaders?.toString() || '0');
      //License update will take place if already a license present
      if (currLicense) {
        if (currLicense.licenseType !== LICENSE_TYPE.TRIAL) {
          const currentExpiry = currLicense.expiryDate;
          const dayDiff = Math.round((currentExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff > 0) {
            // License not expired starts new license from current expiry
            if (organizationSubscription.subscriptionType == 'monthly') {
              expiryDate.setDate(currentExpiry.getDate() + (dayDiff > 1 ? 31 : 32));
            } else {
              expiryDate.setDate(currentExpiry.getDate() + (dayDiff > 1 ? 366 : 367));
            }
          }
        }
        const terms = { ...currLicense.terms };
        terms.type = terms.type === LICENSE_TYPE.TRIAL ? LICENSE_TYPE.BUSINESS : terms.type;
        terms.users.editor = organizationSubscription.noOfEditors;
        terms.users.viewer = organizationSubscription.noOfReaders;
        terms.users.total = totalUsers;
        terms.expiry = expiryDate.toISOString().split('T')[0]; // Not used for cloud

        const expiryWithGracePeriod = new Date(expiryDate);
        expiryWithGracePeriod.setDate(expiryWithGracePeriod.getDate() + 14);
        await manager.update(
          OrganizationsLicense,
          { organizationId: organizationSubscription.organizationId },
          {
            expiryDate,
            expiryWithGracePeriod,
            terms,
            licenseType:
              currLicense.licenseType === LICENSE_TYPE.TRIAL ? LICENSE_TYPE.BUSINESS : currLicense.licenseType,
          }
        );
      } else {
        //Generating new licesne since old is not present
        const expiryWithGracePeriod = new Date(expiryDate);
        expiryWithGracePeriod.setDate(expiryDate.getDate() + 14);
        const licenseTerm: Terms = {
          expiry: expiryDate.toISOString().split('T')[0],
          type: LICENSE_TYPE.BUSINESS,
          workspaceId: organizationSubscription.organizationId,
          users: {
            total: totalUsers,
            editor: organizationSubscription.noOfEditors,
            viewer: organizationSubscription.noOfReaders,
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
            customerName: organizationSubscription.companyName || organizationSubscription.email,
            customerId: organizationSubscription.userId,
          },
        };
        const organizationLicenseObject = manager.create(OrganizationsLicense, {
          organizationId: organizationSubscription.organizationId,
          licenseType: LICENSE_TYPE.BUSINESS,
          expiryDate: expiryDate,
          expiryWithGracePeriod,
          terms: licenseTerm,
        });

        await manager.save(OrganizationsLicense, organizationLicenseObject);
      }

      //Updating subscription status after licesne generation
      organizationSubscription.status = 'active';
      organizationSubscription.isLicenseGenerated = true;
      manager.update(
        OrganizationSubscription,
        { id: organizationSubscription.id, subscriptionId: organizationSubscription.subscriptionId },
        organizationSubscription
      );
      return;
    }, manager);
  }

  async paymentFailedHandler(invoiceObject) {
    const status = 'failed';
    const dueDate = new Date(invoiceObject.period_end * 1000);
    await this.updateInvoice(
      { invoiceDue: dueDate },
      {
        invoiceLink: invoiceObject.hosted_invoice_url,
        invoiceId: invoiceObject.id,
        status: status,
      }
    );
    const manager = getManager();
    const subscription = await manager
      .createQueryBuilder(OrganizationSubscription, 'organization_subscription')
      .leftJoinAndSelect('organization_subscription.user', 'user')
      .where('organization_subscription.subscription_id = :subscriptionId', {
        subscriptionId: invoiceObject.subscription,
      })
      .getOne();
    const { user } = subscription;
    const { email, firstName } = user;
    const licenseStatus = await this.licenseService.getLicenseTerms(LICENSE_FIELD.STATUS, subscription.organizationId);
    const expirationDate = moment(licenseStatus?.expiryDate).utc().format('DD MMMM YYYY, h:mm a');
    this.emailService
      .sendPaymentFailedEmail(email, firstName, invoiceObject.hosted_invoice_url, expirationDate)
      .catch((err) => console.error('Error while sending Payment failed mail', err));
  }

  async subscriptionUpdateHandler(subscriptionObject) {
    const { id, status } = subscriptionObject;
    const failedStatus = ['incomplete', 'incomplete_expired', 'past_due', 'canceled', 'unpaid'];
    const isLicenseGenerated = failedStatus.includes(status) ? false : true;
    await this.updateOrganizationSubscription({ subscriptionId: id }, { status, isLicenseGenerated });
  }

  async upcomingInvoiceHandler(invoiceObject) {
    const { subscription: subscriptionId, status, period_end, hosted_invoice_url, id: invoiceId } = invoiceObject;
    const organizationLicensePayments = await this.getOrganizationLicensePayments(undefined, subscriptionId);
    const { customerId, organizationId, userId, id } = organizationLicensePayments;
    const dueDate = new Date(period_end * 1000);

    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.createUpcomingInvoice(
        {
          organizationSubscriptionId: id,
          customerId,
          status,
          organizationId,
          userId,
          invoiceDue: dueDate,
          invoiceLink: hosted_invoice_url,
          currentPeriodStart: new Date(invoiceObject.period_start * 1000),
          currentPeriodEnd: new Date(invoiceObject.period_end * 1000),
          invoiceId: invoiceId,
          isViewed: false,
          paidDate: null,
          type: 'recurring',
        },
        manager
      );
    });
  }

  async webhookCheckoutSessionCompleteHandler(paymentObject) {
    /**
     * This function handle checkout successful event from stripe webhook and only used for generating license
     * incase of new subscription.It will not handle recurring payment for the existing subscription.
     * @param   paymentObject  : Data object present in checkout successful event of stripe event
     * @returns void.
     */

    const metaData = paymentObject.metadata;

    if (!metaData) {
      // No metadata available -> payment from tooljet.com
      this.emailService
        .sendSubscriptionStartInfoToToolJet(paymentObject)
        .catch((err) => console.error('Error while sending Subscription start info mail', err));
      return;
    }
    const invoiceId = paymentObject.invoice;
    const customerId = paymentObject.customer;
    const subscriptionId = paymentObject.subscription;
    const { organizationId, email, companyName, userId } = metaData;
    const subscriptionType = metaData.subscriptionType;
    const mode = paymentObject.mode;
    const noOfEditors = metaData.editors || 1;
    const noOfReaders = metaData.viewers || 1;
    const paymentStatus = paymentObject.payment_status;
    const invoiceType = 'subscription';
    const stripeAPIKey = this.configService.get<string>('STRIPE_API_KEY');
    const stripe = new Stripe(stripeAPIKey);

    //Getting list of all invoice for all subscription of given organization
    const existOrgSubscription = await this.getOrganizationLicensePayments(organizationId, subscriptionId);

    //Checking if subscription already exist in table as checkout successful event will only handle new subscriptions
    if (existOrgSubscription) {
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
          subscriptionType,
          mode,
          noOfEditors,
          noOfReaders,
          companyName,
          email,
          status: 'active',
          customerId,
        },
        manager
      );

      //Will generate license only if the amount is paid for the event
      if (paymentStatus == 'paid') {
        //do we need to cancel other subscription??Right now its manual based. To be checked in revamp

        //Generating license
        await this.UpdateOrInsertCloudLicense(organizationPayment, manager);
        const invoiceObject = await stripe.invoices.retrieve(paymentObject.invoice);
        if (invoiceObject.billing_reason === 'subscription_create') {
          const dueDate = new Date(invoiceObject.period_end * 1000);
          const invoicePaidDate = new Date(invoiceObject.created * 1000);
          await this.createUpcomingInvoice(
            {
              organizationSubscriptionId: organizationPayment.id,
              customerId,
              status: invoiceObject.status,
              organizationId: organizationPayment.organizationId,
              invoiceDue: dueDate,
              userId: organizationPayment.userId,
              invoiceLink: invoiceObject.hosted_invoice_url,
              currentPeriodStart: new Date(invoiceObject.period_start * 1000),
              currentPeriodEnd: new Date(invoiceObject.period_end * 1000),
              invoiceId: invoiceId,
              isViewed: false,
              paidDate: invoicePaidDate,
              type: invoiceType,
            },
            manager
          );
        }
        await this.sendPaymentConfirmation(manager, invoiceObject, organizationPayment);
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
      console.error(`Payment not success Invoice id: ${invoiceObject?.id}`);
      return;
    }

    const invoiceId = invoiceObject.id;
    const subscriptionId = invoiceObject?.subscription;
    const customerId = invoiceObject.customer;
    const invoiceType = 'recurring';

    let productList: any = {};
    let interval;
    const STRIPE_PRICE_CODE_ITEM_MAPPING = this.STRIPE_PRICE_CODE_ITEM_MAPPING;

    function createItemsList(lineItem) {
      const productType = STRIPE_PRICE_CODE_ITEM_MAPPING[lineItem?.plan?.interval]?.[lineItem?.price?.id];
      if (productType) interval = lineItem?.plan?.interval;
      if (productType == 'reader') {
        productList = {
          ...productList,
          noOfReaders: parseInt(lineItem.quantity),
        };
      } else if (productType == 'editor') {
        productList = {
          ...productList,
          noOfEditors: parseInt(lineItem.quantity),
        };
      }
    }
    const lineItems = invoiceObject.lines.data;
    lineItems.map(createItemsList);
    if ((!productList?.noOfReaders && !productList?.noOfEditors) || !interval) {
      console.log(`Product list ${productList} or interval missing, invoice id: ${invoiceId}`);
      return;
    }
    interval += 'ly';

    //Getting all invoice paid for given subscriptions id
    const subscription = await this.getOrganizationLicensePayments(undefined, subscriptionId);

    if (!subscription) {
      console.error('Subscription id not found');
      return;
    }

    //If payment status was pending while checkout successful this will handle that checkout and generate the license
    subscription.subscriptionType = interval;
    await dbTransactionWrap(async (manager: EntityManager) => {
      if (subscription && (subscription.status === 'incomplete' || !subscription.isLicenseGenerated)) {
        //Handling pending payment
        await this.UpdateOrInsertCloudLicense(subscription, manager);
      } else if (invoiceObject.billing_reason === 'subscription_update') {
        subscription.subscriptionType = interval;
        subscription.noOfEditors = productList.noOfEditors ?? subscription.noOfEditors ?? 1;
        subscription.noOfReaders = productList.noOfReaders ?? subscription.noOfReaders ?? 1;
        await this.UpdateOrInsertCloudLicense(subscription, manager);
        const dueDate = new Date(invoiceObject.period_end * 1000);
        const invoicePaidDate = new Date(invoiceObject.created * 1000);
        await this.createUpcomingInvoice(
          {
            organizationSubscriptionId: subscription.id,
            customerId,
            status: invoiceObject.status,
            organizationId: subscription.organizationId,
            invoiceDue: dueDate,
            userId: subscription.userId,
            invoiceLink: invoiceObject.hosted_invoice_url,
            currentPeriodStart: new Date(invoiceObject.period_start * 1000),
            currentPeriodEnd: new Date(invoiceObject.period_end * 1000),
            invoiceId: invoiceId,
            isViewed: false,
            paidDate: invoicePaidDate,
            type: invoiceType,
          },
          manager
        );
      } else if (
        subscription?.status == 'active' &&
        subscription.isLicenseGenerated &&
        invoiceObject.billing_reason !== 'subscription_cycle'
      ) {
        console.error('Already activated for the subscription id : ' + subscription.subscriptionId);
        return;
      } else {
        //Handling recurring payment as its new invoice for given subscription
        subscription.subscriptionType = interval;
        subscription.noOfEditors = productList.noOfEditors ?? 1;
        subscription.noOfReaders = productList.noOfReaders ?? 1;
        await this.UpdateOrInsertCloudLicense(subscription, manager);
      }
      const dueDate = new Date(invoiceObject.period_end * 1000);
      await this.updateInvoice(
        { organizationSubscriptionId: subscription.id, invoiceDue: dueDate },
        {
          invoiceLink: invoiceObject.hosted_invoice_url,
          invoiceId: invoiceId,
          status: invoiceObject.status,
        }
      );
      if (invoiceObject.paid) {
        await this.sendPaymentConfirmation(manager, invoiceObject, subscription);
      }
    });
  }

  private async sendPaymentConfirmation(manager, invoiceObject, subscription) {
    const user = await manager.findOne(User, { where: { id: subscription.userId } });
    const { firstName, email } = user;
    this.emailService
      .sendPaymentConfirmationEmail(email, firstName, invoiceObject.hosted_invoice_url, invoiceObject.amount_paid)
      .catch((err) => console.error('Error while sending payment confirmation mail', err));
  }

  async getOrganizationLicensePayments(
    organizationId?: string,
    subscriptionId?: string
  ): Promise<OrganizationSubscription> {
    return dbTransactionWrap((manager: EntityManager) => {
      const searchParam = {
        organizationId: organizationId,
        subscriptionId: subscriptionId,
      };
      cleanObject(searchParam);
      if (!searchParam) {
        throw new BadRequestException('Please enter search parameter for license payment object');
      }
      return manager.findOne(OrganizationSubscription, { where: searchParam });
    });
  }

  async createOrganizationLicensePayment(
    organizationPaymentCreateObj: Partial<OrganizationSubscription>,
    manager?: EntityManager
  ): Promise<OrganizationSubscription> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        OrganizationSubscription,
        manager.create(OrganizationSubscription, organizationPaymentCreateObj)
      );
    }, manager);
  }

  async createUpcomingInvoice(
    orgInvoice: Partial<OrganizationSubscriptionInvoice>,
    manager?: EntityManager
  ): Promise<OrganizationSubscriptionInvoice> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        OrganizationSubscriptionInvoice,
        manager.create(OrganizationSubscriptionInvoice, orgInvoice)
      );
    }, manager);
  }

  async updateOrganizationSubscription(updateCondition = {}, updateObject = {}): Promise<OrganizationSubscription> {
    return await dbTransactionWrap((manager: EntityManager) => {
      return manager.update(OrganizationSubscription, { ...updateCondition }, { ...updateObject });
    });
  }

  async getRedirectUrl(user: User, paymentRedirectDto: PaymentRedirectDto) {
    // Updating CRM
    const { email, firstName, lastName, role } = user;
    this.licenseService.updateCRM({
      email,
      firstName,
      lastName,
      role,
      paymentTry: true,
    });

    const stripeAPIKey = this.configService.get<string>('STRIPE_API_KEY');
    const stripe = new Stripe(stripeAPIKey);
    const checkParam = {
      NumberOfViewers: paymentRedirectDto.NumberOfViewers,
      NumberOfEditor: paymentRedirectDto.NumberOfEditor,
    };
    const manager = getManager();
    const validUpgrade = await this.licenseUpgradeValidation(paymentRedirectDto.workspaceId, checkParam, manager);
    if (!validUpgrade) throw new BadRequestException('This is not valid license upgrade request');

    const line_items = [];
    if (paymentRedirectDto.subscriptionType == 'monthly') {
      line_items.push({
        price: this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY_VIEWER'),
        quantity: paymentRedirectDto.NumberOfViewers,
      });
      line_items.push({
        price: this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY_EDITOR'),
        quantity: paymentRedirectDto.NumberOfEditor,
      });
    } else {
      line_items.push({
        price: this.configService.get<string>('STRIPE_PRICE_ID_YEARLY_VIEWER'),
        quantity: paymentRedirectDto.NumberOfViewers,
      });
      line_items.push({
        price: this.configService.get<string>('STRIPE_PRICE_ID_YEARLY_EDITOR'),
        quantity: paymentRedirectDto.NumberOfEditor,
      });
    }

    const discounts: Array<Stripe.Checkout.SessionCreateParams.Discount> = [];

    if (paymentRedirectDto.promo_code) {
      // Add the coupon to discounts array
      const couponDiscount: Stripe.Checkout.SessionCreateParams.Discount = {};
      const promotionCodes = await stripe.promotionCodes.list({
        limit: 3,
        active: true,
        code: paymentRedirectDto.promo_code,
      });
      const promotionList = promotionCodes?.data;
      if (!promotionList || promotionList.length === 0) {
        throw new BadRequestException(`Invalid promotion code '${paymentRedirectDto.promo_code}'`);
      }
      couponDiscount.promotion_code = promotionList[0].id;

      discounts.push(couponDiscount);
    }
    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: paymentRedirectDto.mode,
      customer_email: paymentRedirectDto.customer_email,
      success_url: paymentRedirectDto.success_url,
      cancel_url: paymentRedirectDto.cancel_url,
      discounts: discounts,
      metadata: {
        organizationId: paymentRedirectDto.workspaceId,
        subscriptionType: paymentRedirectDto.subscriptionType,
        editors: paymentRedirectDto.NumberOfEditor,
        viewers: paymentRedirectDto.NumberOfViewers,
        email: user.email,
        companyName: user.companyName,
        userId: user.id,
      },
    });

    return { redirectUrl: session.url };
  }
}
