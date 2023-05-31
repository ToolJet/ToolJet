import { IsNotEmpty, IsString } from 'class-validator';

export class LicenseUpdateDto {
  @IsNotEmpty()
  @IsString()
  key: string;
}
