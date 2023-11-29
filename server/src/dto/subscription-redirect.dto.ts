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
  @IsOptional()
  @IsNotEmpty()
  workspaceId: string;

  @IsEnum(SubscriptionType)
  subsribtionType: string;

  @IsEnum(SubscriptionMode)
  mode: Stripe.Checkout.SessionCreateParams.Mode;

  @IsString()
  success_url: string;

  @IsString()
  cancel_url: string;

  @IsEmail()
  customer_email: string;

  @IsInt()
  NumberOfEditor: number;

  @IsInt()
  NumberOfBuilder: number;
}

export class PaymentRedirectDtoObject extends PartialType(PaymentRedirectDto) {}
