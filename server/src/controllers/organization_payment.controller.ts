import { PaymentRedirectDto } from '@dto/subscription-redirect.dto';
import { UpdateSubscriptionDto } from '@dto/update-subscription.dto';
import { OrganizationLicenseAccessGuard } from '@ee/licensing/guards/organizationLicenseAccess.guard';
import { Body, Controller, Get, Headers, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { OrganizationPaymentService } from '@services/organization_payment.service';
import { User } from 'src/decorators/user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { StripeWebhookGuard } from 'src/modules/auth/stripe-webhook.guard';

@Controller('organization/payment')
export class OrganizationPaymentController {
  constructor(private organizationPaymentService: OrganizationPaymentService) {}

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Get(':organizationId/invoice')
  async getUpcomingInvoice(@Param('organizationId') organizationId: string) {
    const invoice = await this.organizationPaymentService.getUpcomingInvoice(organizationId);
    return invoice;
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Get(':organizationId/plan')
  async generatePaymentLink(@Param('organizationId') organizationId: string) {
    const result = await this.organizationPaymentService.getCurrentPlan(organizationId);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':organizationId/invoice/:id')
  async updateInvoice(@Param('organizationId') organizationId: string, @Param('id') id: string) {
    const result = await this.organizationPaymentService.updateInvoice({ organizationId, id }, { isViewed: true });
    return result;
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Post(':organizationId/proration')
  async getProration(@Param('organizationId') organizationId: string, @Body() prorationDto) {
    const result = await this.organizationPaymentService.getProration(organizationId, prorationDto);
    return result;
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Post(':organizationId/portal-link')
  async createPortalLink(@Body() portalDto) {
    const result = await this.organizationPaymentService.getPortalLink(portalDto);
    return result;
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Put(':organizationId/subscription')
  async updateSubscription(
    @Param('organizationId') organizationId: string,
    @Body() updatedSubscription: UpdateSubscriptionDto
  ) {
    const result = await this.organizationPaymentService.updateSubscription(organizationId, updatedSubscription);
    return result;
  }

  @UseGuards(StripeWebhookGuard)
  @Post('webhooks')
  async getWebhookEvent(@Headers('stripe-signature') signature: string, @Req() request, @Res() response) {
    const event = request.body;

    // fr every new subscription there will be checkout session -> no other channel for subscription

    switch (event.type) {
      case 'checkout.session.completed': {
        const paymentObject = event.data.object;
        await this.organizationPaymentService.webhookCheckoutSessionCompleteHandler(paymentObject);
        break;
      }
      case 'invoice.upcoming': {
        const invoiceObject = event.data.object;
        await this.organizationPaymentService.upcomingInvoiceHandler(invoiceObject);
        break;
      }
      case 'invoice.payment_failed': {
        const invoiceObject = event.data.object;
        await this.organizationPaymentService.paymentFailedHandler(invoiceObject);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await this.organizationPaymentService.subscriptionUpdateHandler(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoiceObject = event.data.object;
        await this.organizationPaymentService.webhookInvoicePaidHandler(invoiceObject);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}.`);
    }
    response.send();
  }

  @UseGuards(JwtAuthGuard)
  @Post('redirect')
  async getRedirectURL(@User() user, @Body() paymentRedirectDto: PaymentRedirectDto) {
    const result = await this.organizationPaymentService.getRedirectUrl(user, paymentRedirectDto);
    return result;
  }
}
