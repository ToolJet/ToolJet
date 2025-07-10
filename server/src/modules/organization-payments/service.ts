import { Injectable } from '@nestjs/common';
import { IOrganizationPaymentService } from './interfaces/IService';
import { OrganizationSubscription } from '@entities/organization_subscription.entity';
import { OrganizationSubscriptionInvoice } from '@entities/organization_subscription_invoice.entity';
import { ProrationDto, PortalDto, PaymentRedirectDto } from './dto';

@Injectable()
export class OrganizationPaymentService implements IOrganizationPaymentService {
  constructor() {}
  getUpcomingInvoice(organizationId: string): Promise<OrganizationSubscriptionInvoice> {
    throw new Error('Method not implemented.');
  }
  getCurrentPlan(organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  updateInvoice(updateCondition?: any, updateObject?: any): Promise<OrganizationSubscriptionInvoice> {
    throw new Error('Method not implemented.');
  }
  getProration(organizationId: string, prorationDto: ProrationDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getPortalLink(portalDto: PortalDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  updateSubscription(organizationId: string, updatedSubscription: ProrationDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  licenseUpgradeValidation(organizationId: string, checkParam: any, manager?: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  UpdateOrInsertCloudLicense(organizationSubscription: OrganizationSubscription, manager?: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  paymentFailedHandler(invoiceObject: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  subscriptionUpdateHandler(subscriptionObject: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  upcomingInvoiceHandler(invoiceObject: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  webhookCheckoutSessionCompleteHandler(paymentObject: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  webhookInvoicePaidHandler(invoiceObject: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getOrganizationLicensePayments(organizationId?: string, subscriptionId?: string): Promise<OrganizationSubscription> {
    throw new Error('Method not implemented.');
  }
  createOrganizationLicensePayment(
    organizationPaymentCreateObj: Partial<OrganizationSubscription>,
    manager?: any
  ): Promise<OrganizationSubscription> {
    throw new Error('Method not implemented.');
  }
  createUpcomingInvoice(
    orgInvoice: Partial<OrganizationSubscriptionInvoice>,
    manager?: any
  ): Promise<OrganizationSubscriptionInvoice> {
    throw new Error('Method not implemented.');
  }
  updateOrganizationSubscription(updateCondition?: any, updateObject?: any): Promise<OrganizationSubscription> {
    throw new Error('Method not implemented.');
  }
  getRedirectUrl(user: any, paymentRedirectDto: PaymentRedirectDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
