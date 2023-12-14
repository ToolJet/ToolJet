import {
  Body,
  Controller,
  UseGuards,
  Patch,
  Get,
  Post,
  Param,
  Req,
  Res,
  Headers,
  BadRequestException,
} from '@nestjs/common';
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
import { User } from 'src/decorators/user.decorator';
import { getManager } from 'typeorm';
import { User as UserEntity } from 'src/entities/user.entity';

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
    @Param('organizationId') organizationId: string,
    @User() user: UserEntity
  ) {
    // Generate a cloud trial license and update the license details
    const licenseKey = await this.organizationLicenseService.generateCloudTrialLicense(createCloudTrialLicenseDto);
    await this.licenseService.updateLicense({ key: licenseKey }, organizationId);

    this.licenseService.updateCRM({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isCloudTrialOpted: true,
    });
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Get(':organizationId/access')
  async accessLimits(@Param('organizationId') organizationId: string) {
    // calling the license service getTerms function, it handles both cloud and ee
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
    const event = request.body;

    // fr every new subscription there will be checkout session -> no other channel for subscription

    switch (event.type) {
      case 'checkout.session.completed': {
        const paymentObject = event.data.object;
        await this.organizationLicenseService.webhookCheckoutSessionCompleteHandler(paymentObject);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoiceObject = event.data.object;
        await this.organizationLicenseService.webhookInvoicePaidHandler(invoiceObject);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}.`);
    }
    response.send();
  }

  @UseGuards(JwtAuthGuard)
  @Post('payment/redirect')
  async getRedirectURL(@User() user, @Body() paymentRedirectDto: PaymentRedirectDto) {
    const stripeAPIKey = this.configService.get<string>('STRIPE_API_KEY');
    const stripe = new Stripe(stripeAPIKey);
    const checkParam = {
      NumberOfViewers: paymentRedirectDto.NumberOfViewers,
      NumberOfEditor: paymentRedirectDto.NumberOfEditor,
    };
    const manager = getManager();
    const validUpgrade = await this.organizationLicenseService.licenseUpgradeValidation(
      paymentRedirectDto.workspaceId,
      checkParam,
      manager
    );
    if (!validUpgrade) throw new BadRequestException('This is not valid license upgrade request');

    const line_items = [];
    if (paymentRedirectDto.subsribtionType == 'monthly') {
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
    if (paymentRedirectDto.coupon_code || paymentRedirectDto.promo_code) {
      // Add the coupon to discounts array
      const couponDiscount: Stripe.Checkout.SessionCreateParams.Discount = {};

      if (paymentRedirectDto.coupon_code) {
        couponDiscount.coupon = paymentRedirectDto.coupon_code;
      }

      if (paymentRedirectDto.promo_code) {
        couponDiscount.promotion_code = paymentRedirectDto.promo_code;
      }

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
        subscriptionType: paymentRedirectDto.subsribtionType,
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

// /api/license/organization/payment/webhooks
