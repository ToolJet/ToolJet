import { IsNotEmpty, IsString } from 'class-validator';

export class CreateExtensionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  file_id: string;

  @IsString()
  organization_id: string;
}
