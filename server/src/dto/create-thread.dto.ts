import { IsBoolean, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateThreadDTO {
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
}
