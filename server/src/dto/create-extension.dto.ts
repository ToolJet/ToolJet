import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateExtensionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsOptional()
  organizationId: string;
}
