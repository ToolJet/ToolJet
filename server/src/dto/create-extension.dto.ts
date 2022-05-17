import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExtensionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  file_id: string;

  @IsString()
  @IsOptional()
  organization_id: string;
}
