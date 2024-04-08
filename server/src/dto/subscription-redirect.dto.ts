import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Stripe } from 'stripe';

export enum SubscriptionMode {
  PAYMENT = 'payment',
  SETUP = 'setup',
  SUBSCRIPTION = 'subscription',
}

export enum SubscriptionType {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class PaymentRedirectDto {
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsEnum(SubscriptionType)
  subscriptionType: string;

  @IsEnum(SubscriptionMode)
  mode: Stripe.Checkout.SessionCreateParams.Mode;

  @IsString()
  success_url: string;

  @IsString()
  cancel_url: string;

  @IsOptional()
  @IsString()
  promo_code: string;

  @IsEmail()
  customer_email: string;

  @IsInt({ message: 'Number of builders should be an integer. ' })
  NumberOfEditor: number;

  @IsInt({ message: 'Number of end users should be an integer.' })
  NumberOfViewers: number;
}

export class PaymentRedirectDtoObject extends PartialType(PaymentRedirectDto) {}
