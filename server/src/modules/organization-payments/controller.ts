import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { Controller, UseGuards } from '@nestjs/common';
import { IOrganizationPaymentController } from './interfaces/IController';
import { ProrationDto, PortalDto, PaymentRedirectDto } from './dto';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from './ability/guard';

@Controller('organization/payment')
@InitModule(MODULES.ORGANIZATION_PAYMENTS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class OrganizationPaymentController implements IOrganizationPaymentController {
  constructor() {}
  getUpcomingInvoice(organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getCurrentPlan(organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  updateInvoice(organizationId: string, id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getProration(organizationId: string, prorationDto: ProrationDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getPortalLink(portalDto: PortalDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  updateSubscription(organizationId: string, prorationDto: ProrationDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  webhookCheckoutSessionCompleteHandler(paymentObject: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  upcomingInvoiceHandler(invoiceObject: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  paymentFailedHandler(invoiceObject: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  subscriptionUpdateHandler(subscription: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  webhookInvoicePaidHandler(invoiceObject: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getRedirectUrl(user: any, paymentRedirectDto: PaymentRedirectDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
