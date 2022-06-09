import { IsNotEmpty, IsString, IsUUID, IsOptional, IsSemVer } from 'class-validator';

export class CreateExtensionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsSemVer()
  version: string;

  @IsUUID()
  @IsOptional()
  organizationId: string;
}
