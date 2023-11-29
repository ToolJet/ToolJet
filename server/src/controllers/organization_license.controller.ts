import { Body, Controller, UseGuards, Patch, Get, Post, Param, Req, Res, Headers } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { OrganizationLicenseService } from '@services/organization_license.service';
import { LicenseUpdateDto } from '@dto/license.dto';
import { decamelizeKeys } from 'humps';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
import { CreateCloudTrialLicenseDto } from '@dto/create-cloud-trial-license.dto';
import { LicenseService } from '@services/license.service';
import { OrganizationLicenseAccessGuard } from '@ee/licensing/guards/organizationLicenseAccess.guard';
import { StripeWebhookGuard } from 'src/modules/auth/stripe-webhook.guard';
import { Stripe } from 'stripe';
import { PaymentRedirectDto } from 'src/dto/subscription-redirect.dto';
import { ConfigService } from '@nestjs/config';

@Controller('license/organization')
export class OrganizationLicenseController {
  constructor(
    private organizationLicenseService: OrganizationLicenseService,
    private licenseService: LicenseService,
    private configService: ConfigService
  ) {}

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Get(':organizationId')
  async index(@Param('organizationId') organizationId: string) {
    const licenseSetting = await this.organizationLicenseService.getLicense(organizationId);
    return decamelizeKeys(licenseSetting);
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Post(':organizationId/trial')
  async generateCloudTrialLicense(
    @Body() createCloudTrialLicenseDto: CreateCloudTrialLicenseDto,
    @Param('organizationId') organizationId: string
  ) {
    // Generate a cloud trial license and update the license details
    const licenseKey = await this.organizationLicenseService.generateCloudTrialLicense(createCloudTrialLicenseDto);
    await this.licenseService.updateLicense({ key: licenseKey }, organizationId);
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Get(':organizationId/access')
  async accessLimits(@Param('organizationId') organizationId: string) {
    const licenseTerms = await this.licenseService.getLicenseTerms(
      [LICENSE_FIELD.FEATURES, LICENSE_FIELD.STATUS],
      organizationId
    );
    return { ...licenseTerms[LICENSE_FIELD.FEATURES], licenseStatus: licenseTerms[LICENSE_FIELD.STATUS] };
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Get(':organizationId/terms')
  async terms(@Param('organizationId') organizationId: string) {
    // calling the license service getTerms function, it handles both cloud and ee
    const licenseTerms = await this.licenseService.getLicenseTerms(undefined, organizationId);
    return { terms: licenseTerms };
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Patch(':organizationId')
  async updateLicenseKey(@Body() licenseUpdateDto: LicenseUpdateDto, @Param('organizationId') organizationId: string) {
    await this.licenseService.updateLicense(licenseUpdateDto, organizationId);
    return;
  }

  @UseGuards(StripeWebhookGuard)
  @Post('payment/webhooks')
  async getWebhookEvent(@Headers('stripe-signature') signature: string, @Req() request, @Res() response) {
    const stripeAPIKey = this.configService.get<string>('STRIPE_API_KEY');
    const stripe = new Stripe(stripeAPIKey);
    const event = request.body;
    console.log(JSON.stringify(event));
    const invoice = await stripe.invoices.retrieve(event.data.object.invoice);
    console.log(JSON.stringify(invoice));

    switch (event.type) {
      case 'checkout.session.completed': {
        const paymentObject = event.data.object;
        if (paymentObject.payment_status === 'paid') {
          const metaData = paymentObject.metadata;
          console.log(metaData);
          const invoiceId = paymentObject.invoice;
          const subscriptionId = paymentObject.subscription;
          const organizationId = metaData.organizationId;
          const invoicePaidDate = new Date(paymentObject.created * 1000);
          const subscriptionType = metaData.subscriptionType;
          const mode = paymentObject.mode;
          const noOfEditors = metaData.editors;
          const noOfReaders = metaData.viewers;

          const organizationPayment = await this.organizationLicenseService.createOrgnaizationLicensePAyment({
            organizationId,
            subscriptionId,
            invoiceId,
            invoicePaidDate,
            subscriptionType,
            mode,
            noOfEditors,
            noOfReaders,
          });

          console.log('Created organization payment object ', organizationPayment);
        }
        console.log(`status ${paymentObject.payment_status}`);
        break;
      }

      // case 'checkout.session.completed': {
      //   console.log('This is running');
      //   break;
      // }
      default:
        console.log(`Unhandled event type ${event.type}.`);
    }
    response.send();
  }

  @Post('payment/redirect')
  async getRedirectURL(@Body() paymentRedirectDto: PaymentRedirectDto) {
    const stripeAPIKey = this.configService.get<string>('STRIPE_API_KEY');
    const stripe = new Stripe(stripeAPIKey);
    const line_items = [];
    if (paymentRedirectDto.subsribtionType == 'monthly') {
      line_items.push({ price: 'price_1OBwGyE67rQ5743AmOGy1TBT', quantity: paymentRedirectDto.NumberOfBuilder });
      line_items.push({ price: 'price_1OBwGyE67rQ5743A1grVmEzF', quantity: paymentRedirectDto.NumberOfEditor });
    } else {
      line_items.push({ price: 'price_1OBwGyE67rQ5743AmOGy1TBT', quantity: paymentRedirectDto.NumberOfBuilder });
      line_items.push({ price: 'price_1OBwGyE67rQ5743A1grVmEzF', quantity: paymentRedirectDto.NumberOfEditor });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      client_reference_id: '0c856652-e4a6-40e6-a64d-379e9d1b2a54',
      mode: paymentRedirectDto.mode,
      customer_email: paymentRedirectDto.customer_email,
      success_url: paymentRedirectDto.success_url,
      cancel_url: paymentRedirectDto.cancel_url,
      metadata: {
        organizationId: paymentRedirectDto.workspaceId,
        subscriptionType: paymentRedirectDto.subsribtionType,
        editors: paymentRedirectDto.NumberOfEditor,
        viewers: paymentRedirectDto.NumberOfBuilder,
      },
    });

    return { redirectUrl: session.url };
  }
}
