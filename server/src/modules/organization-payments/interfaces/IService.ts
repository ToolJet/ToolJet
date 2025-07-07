import { OrganizationSubscriptionInvoice } from '@entities/organization_subscription_invoice.entity';
import { PaymentRedirectDto, PortalDto, ProrationDto } from '../dto';
import { OrganizationSubscription } from '@entities/organization_subscription.entity';

export interface IOrganizationPaymentService {
  getUpcomingInvoice(organizationId: string): Promise<OrganizationSubscriptionInvoice>;

  getCurrentPlan(organizationId: string): Promise<any>;

  updateInvoice(updateCondition?: any, updateObject?: any): Promise<OrganizationSubscriptionInvoice>;

  getProration(organizationId: string, prorationDto: ProrationDto): Promise<any>;

  getPortalLink(portalDto: PortalDto): Promise<any>;

  updateSubscription(organizationId: string, updatedSubscription: ProrationDto): Promise<any>;

  licenseUpgradeValidation(organizationId: string, checkParam: any, manager?: any): Promise<void>;

  UpdateOrInsertCloudLicense(organizationSubscription: OrganizationSubscription, manager?: any): Promise<void>;

  paymentFailedHandler(invoiceObject: any): Promise<void>;

  subscriptionUpdateHandler(subscriptionObject: any): Promise<void>;

  upcomingInvoiceHandler(invoiceObject: any): Promise<void>;

  webhookCheckoutSessionCompleteHandler(paymentObject: any): Promise<void>;

  webhookInvoicePaidHandler(invoiceObject: any): Promise<void>;

  getOrganizationLicensePayments(organizationId?: string, subscriptionId?: string): Promise<OrganizationSubscription>;

  createOrganizationLicensePayment(
    organizationPaymentCreateObj: Partial<OrganizationSubscription>,
    manager?: any
  ): Promise<OrganizationSubscription>;

  createUpcomingInvoice(
    orgInvoice: Partial<OrganizationSubscriptionInvoice>,
    manager?: any
  ): Promise<OrganizationSubscriptionInvoice>;

  updateOrganizationSubscription(updateCondition?: any, updateObject?: any): Promise<OrganizationSubscription>;

  getRedirectUrl(user: any, paymentRedirectDto: PaymentRedirectDto): Promise<any>;
}
