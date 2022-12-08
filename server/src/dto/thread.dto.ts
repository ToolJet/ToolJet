import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateThreadDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsUUID()
  appId: string;

  @IsUUID()
  @IsOptional()
  organizationId: string;

  @IsUUID()
  appVersionsId: string;

  @IsBoolean()
  @IsOptional()
  isResolved: boolean;

  @IsUUID()
  @IsOptional()
  pageId: string;
}

export class UpdateThreadDto extends PartialType(CreateThreadDto) {}
