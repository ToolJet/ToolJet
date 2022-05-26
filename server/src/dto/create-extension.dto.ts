import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExtensionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  file_id: string;

  @IsString()
  @IsOptional()
  organization_id: string;

  @IsString()
  @IsOptional()
  file: Express.Multer.File;
}
