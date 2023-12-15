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
  coupon_code: string;

  @IsOptional()
  @IsString()
  promo_code: string;

  @IsEmail()
  customer_email: string;

  @IsInt()
  NumberOfEditor: number;

  @IsInt()
  NumberOfViewers: number;
}

export class PaymentRedirectDtoObject extends PartialType(PaymentRedirectDto) {}
