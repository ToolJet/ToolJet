import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsEnum, IsInt } from 'class-validator';
import { Stripe } from 'stripe';

export class PortalDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  returnUrl: string;
}

class ItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  quantity: string;

  @IsString()
  @IsNotEmpty()
  interval: string;

  @IsString()
  @IsNotEmpty()
  planId: string;
}

export class ProrationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];

  @IsBoolean()
  includeChange: boolean;

  @IsNotEmpty()
  prorationDate: number;

  @IsNotEmpty()
  planForm: any;
}

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

class Item {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  quantity: string;

  @IsString()
  @IsNotEmpty()
  interval: string;

  @IsString()
  @IsNotEmpty()
  planId: string;
}

export class UpdateSubscriptionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Item)
  items: Item[];

  @IsNumber()
  prorationDate: number;

  @IsBoolean()
  includeChange: boolean;

  @IsNotEmpty()
  planForm: any;
}
