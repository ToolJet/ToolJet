import { PortalDto, ProrationDto, PaymentRedirectDto } from '@modules/organization-payments/dto';

export interface IOrganizationPaymentController {
  getUpcomingInvoice(organizationId: string): Promise<any>;

  getCurrentPlan(organizationId: string): Promise<any>;

  updateInvoice(organizationId, string, id: string): Promise<any>;

  getProration(organizationId: string, prorationDto: ProrationDto): Promise<any>;

  getPortalLink(portalDto: PortalDto): Promise<any>;

  updateSubscription(organizationId: string, prorationDto: ProrationDto): Promise<any>;

  webhookCheckoutSessionCompleteHandler(paymentObject: any): Promise<void>;

  upcomingInvoiceHandler(invoiceObject: any): Promise<void>;

  paymentFailedHandler(invoiceObject: any): Promise<void>;

  subscriptionUpdateHandler(subscription: any): Promise<void>;

  webhookInvoicePaidHandler(invoiceObject: any): Promise<void>;

  getRedirectUrl(user: any, paymentRedirectDto: PaymentRedirectDto): Promise<any>;
}
