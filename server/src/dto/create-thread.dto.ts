import { IsBoolean, IsInt, IsString, IsUUID } from 'class-validator';

export class CreateThreadDTO {
  @IsInt()
  x: number;

  @IsInt()
  y: number;

  @IsUUID()
  appId: string;

  @IsUUID()
  organizationId: string;

  @IsString()
  currentVersionId: string;

  @IsBoolean()
  isResolved: boolean;
}
