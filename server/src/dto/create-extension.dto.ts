import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExtensionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  organizationId: string;

  @IsString()
  @IsOptional()
  fileId: string;
}
