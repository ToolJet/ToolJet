import { IsBoolean, IsInt, IsUUID } from 'class-validator';

export class CreateThreadDTO {
  @IsInt()
  x: number;

  @IsInt()
  y: number;

  @IsUUID()
  appId: string;

  @IsUUID()
  organizationId: string;

  @IsUUID()
  appVersionsId: string;

  @IsBoolean()
  isResolved: boolean;
}
