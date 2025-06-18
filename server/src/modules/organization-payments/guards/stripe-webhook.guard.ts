import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Stripe } from 'stripe';

@Injectable()
export class StripeWebhookGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async validateStripeEvent(payload): Promise<boolean> {
    const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_ENDPOINT_SECRET');
    const stripeAPIKey = this.configService.get<string>('STRIPE_API_KEY');
    const stripe = new Stripe(stripeAPIKey);
    const header = stripe.webhooks.generateTestHeaderString({
      payload: payload,
      secret: endpointSecret,
    });
    if (endpointSecret) {
      try {
        stripe.webhooks.constructEvent(payload, header, endpointSecret);
        return true;
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return false;
      }
    }
    return false;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const payload = request.rawBody;
    const isStripeEvent = await this.validateStripeEvent(payload);
    if (isStripeEvent) return true;
    else return false;
  }
}
